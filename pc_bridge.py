"""Local-only Music Studio PC bridge: serves the existing web UI and creates LRC with faster-whisper.

Install Python 3.10+ and FFmpeg, then pip install -r pc-requirements.txt.
Run: python pc_bridge.py
Visit http://127.0.0.1:8765 (not the GitHub Pages URL).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
MAX_AUDIO_BYTES = 100 * 1024 * 1024
LANGS = {"auto": None, "vi": "vi", "ja": "ja", "en": "en"}
MODEL = os.environ.get("KARAOKE_WHISPER_MODEL", "small")
DEVICE = os.environ.get("KARAOKE_DEVICE", "auto")
COMPUTE_TYPE = os.environ.get("KARAOKE_COMPUTE_TYPE", "auto")
_model = None


def lrc_stamp(seconds: float) -> str:
    centiseconds = max(0, round(seconds * 100))
    minutes, remainder = divmod(centiseconds, 6000)
    return f"{minutes:02}:{remainder // 100:02}.{remainder % 100:02}"


def rows_to_lrc(rows: list[dict]) -> str:
    return "\n".join(f"[{lrc_stamp(row['start'])}]{row['text']}" for row in rows)


def transcribe(path: Path, language: str) -> list[dict]:
    global _model
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("Không tìm thấy FFmpeg trong PATH.")
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError("Thiếu faster-whisper. Chạy: pip install -r pc-requirements.txt") from exc
    with tempfile.TemporaryDirectory(prefix="musicstudio-wav-") as directory:
        wav = Path(directory) / "audio.wav"
        subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
             "-i", str(path), "-vn", "-ac", "1", "-ar", "16000", str(wav)],
            check=True, timeout=600, capture_output=True,
        )
        if _model is None:
            _model = WhisperModel(MODEL, device=DEVICE, compute_type=COMPUTE_TYPE)
        segments, _ = _model.transcribe(
            str(wav), language=LANGS[language], vad_filter=True, beam_size=5
        )
        return [
            {"start": round(max(0, segment.start), 2),
             "end": round(segment.end, 2),
             "text": segment.text.strip()}
            for segment in segments if segment.text.strip()
        ]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def reply(self, status: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/api/pc/health":
            self.reply(200, {"ok": True, "mode": "pc", "model": MODEL, "device": DEVICE})
            return
        super().do_GET()

    def do_POST(self) -> None:
        request = urlparse(self.path)
        if request.path != "/api/pc/transcribe":
            self.reply(404, {"error": "Không tìm thấy API."})
            return
        origin = self.headers.get("Origin")
        if origin and origin != f"http://{self.headers.get('Host')}":
            self.reply(403, {"error": "Chỉ chấp nhận yêu cầu từ Music Studio local."})
            return
        if self.headers.get("Content-Type", "").split(";")[0] != "application/octet-stream":
            self.reply(415, {"error": "Yêu cầu file âm thanh dạng octet-stream."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if not 0 < length <= MAX_AUDIO_BYTES:
            self.reply(413, {"error": "File phải lớn hơn 0 và không quá 100 MB."})
            return
        language = parse_qs(request.query).get("language", ["auto"])[0]
        if language not in LANGS:
            self.reply(400, {"error": "Ngôn ngữ không hợp lệ."})
            return
        try:
            with tempfile.TemporaryDirectory(prefix="musicstudio-upload-") as directory:
                input_file = Path(directory) / "input.audio"
                with input_file.open("wb") as output:
                    remaining = length
                    while remaining:
                        block = self.rfile.read(min(1024 * 1024, remaining))
                        if not block:
                            raise ValueError("File tải lên bị ngắt giữa chừng.")
                        output.write(block)
                        remaining -= len(block)
                rows = transcribe(input_file, language)
            self.reply(200, {"ok": True, "rows": rows, "lrc": rows_to_lrc(rows)})
        except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as exc:
            self.reply(422, {"error": str(exc)})
        except Exception as exc:
            self.log_error("Transcription failed: %s", exc)
            self.reply(500, {"error": "Xử lý thất bại. Kiểm tra terminal PC bridge."})


if __name__ == "__main__":
    address = ("127.0.0.1", int(os.environ.get("KARAOKE_PORT", "8765")))
    print(f"Music Studio PC: http://{address[0]}:{address[1]}")
    print(f"Whisper model={MODEL}, device={DEVICE}. Đóng terminal để dừng.")
    ThreadingHTTPServer(address, Handler).serve_forever()
