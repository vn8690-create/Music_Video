/* Optional PC karaoke bridge. No effect on the hosted web version. */
(() => {
  'use strict';
  const parent = document.getElementById('aiHeading')?.closest('.ai-panel');
  if (!parent) return;
  const panel = document.createElement('details');
  panel.id = 'pcBridgePanel';
  panel.style.cssText = 'margin-top:16px;padding:12px;border:1px solid #5b596c;border-radius:10px';
  panel.innerHTML = `
    <summary>🎤 PC AI (Whisper trên Windows) <span id="pcBridgeFlag" style="font-size:12px;color:#aaa4bd">Đang kiểm tra…</span></summary>
    <p class="hint">Chạy <code>MO_MUSIC_STUDIO_PC.bat</code> và mở <code>http://127.0.0.1:8765</code>. Chọn file nhạc, AI tạo LRC; kiểm tra lời trước khi xuất video. Model Whisper lần đầu cần tải về.</p>
    <label class="field">Nhạc cần nhận diện (MP3/WAV/M4A…) <input id="pcBridgeAudio" type="file" accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.aac"></label>
    <label class="field">Ngôn ngữ <select id="pcBridgeLanguage"><option value="vi">Tiếng Việt</option><option value="ja">日本語</option><option value="en">English</option><option value="auto">Tự nhận diện</option></select></label>
    <div class="buttons"><button type="button" id="pcBridgeRun" disabled>Tạo sub bằng PC</button><button type="button" id="pcBridgeApply" disabled>Đưa vào Music Studio</button><button type="button" id="pcBridgeSave" disabled>Tải LRC</button></div>
    <p id="pcBridgeStatus" role="status" aria-live="polite" class="hint"></p>
    <label class="field">Xem và sửa mốc/lời trước khi áp dụng <textarea id="pcBridgeResult" spellcheck="false" placeholder="LRC từ PC sẽ xuất hiện ở đây"></textarea></label>
  `;
  parent.appendChild(panel);
  const el = (name) => panel.querySelector('#pcBridge' + name);
  const status = el('Status');
  const flag = el('Flag');
  let healthy = false;
  const isPcOrigin = ['127.0.0.1','localhost'].includes(location.hostname) && location.port === '8765';
  async function check() {
    if (!isPcOrigin) {
      status.textContent = 'PC AI chỉ chạy khi mở Music Studio bằng địa chỉ local 127.0.0.1:8765. Trang GitHub Pages vẫn dùng chế độ Web AI.';
      flag.textContent = 'Chưa kết nối PC';
      return;
    }
    try {
      const response = await fetch('/api/pc/health', {cache:'no-store'});
      const result = await response.json();
      healthy = response.ok && result.ok && result.mode === 'pc';
      flag.textContent = healthy ? 'Đã kết nối' : 'Chưa kết nối';
      status.textContent = healthy ? 'PC bridge sẵn sàng · Model: ' + result.model + ' · Thiết bị: ' + result.device : 'Không thấy dịch vụ PC bridge.';
    } catch {
      flag.textContent = 'Chưa kết nối PC';
      status.textContent = 'Không tìm thấy dịch vụ PC bridge. Chạy MO_MUSIC_STUDIO_PC.bat trước.';
    }
    el('Run').disabled = !healthy;
  }
  el('Run').addEventListener('click', async () => {
    const file = el('Audio').files?.[0];
    if (!file) { status.textContent = 'Chọn file nhạc trước.'; return; }
    if (file.size > 100 * 1024 * 1024) { status.textContent = 'File lớn hơn 100 MB.'; return; }
    if (!healthy) return;
    el('Run').disabled = true;
    el('Apply').disabled = true;
    el('Save').disabled = true;
    status.textContent = 'Đang xử lý bằng Whisper trên PC. Vui lòng giữ trang mở…';
    try {
      const response = await fetch('/api/pc/transcribe?language=' + encodeURIComponent(el('Language').value), {
        method: 'POST', headers: {'Content-Type':'application/octet-stream'}, body: file
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Không tạo được phụ đề.');
      el('Result').value = data.lrc;
      el('Apply').disabled = !data.rows.length;
      el('Save').disabled = !data.rows.length;
      status.textContent = 'Đã nhận diện ' + data.rows.length + ' câu. Hãy nghe lại và sửa lỗi lời hát/mốc thời gian trước khi áp dụng.';
    } catch (error) {
      status.textContent = 'Lỗi PC AI: ' + error.message;
    } finally {
      el('Run').disabled = !healthy;
    }
  });
  el('Apply').addEventListener('click', () => {
    const lyrics = document.getElementById('lyrics');
    const apply = document.getElementById('applyLyrics');
    if (!lyrics || !apply || !el('Result').value.trim()) return;
    // Existing Music Studio importer handles its timing, preview, and export.
    lyrics.value = el('Result').value;
    apply.click();
    status.textContent = 'Đã đưa LRC vào Music Studio. Xem thử và căn lại nếu cần.';
  });
  el('Save').addEventListener('click', () => {
    const value = el('Result').value;
    if (!value.trim()) return;
    const href = URL.createObjectURL(new Blob(['\uFEFF' + value], {type:'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = 'karaoke-pc-ai.lrc';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(href), 5000);
  });
  check();
})();
