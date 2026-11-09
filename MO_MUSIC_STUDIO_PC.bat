@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Python. Cai Python 3.10+ va them vao PATH.
  pause
  exit /b 1
)
python -c "import faster_whisper" >nul 2>nul
if errorlevel 1 (
  echo Cai thu vien PC AI lan dau...
  python -m pip install -r pc-requirements.txt
  if errorlevel 1 (
    echo Cai thu vien that bai. Kiem tra Python va mang.
    pause
    exit /b 1
  )
)
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo CHUA CO FFMPEG trong PATH. Cai FFmpeg va mo lai terminal.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8765"
python pc_bridge.py
pause
