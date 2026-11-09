# Music Studio + Karaoke AI (PC Mode, MVP)

Bản này **không thay đổi** chế độ Web hiện có. GitHub Pages chạy như trước. Khi mở bằng bridge local Windows, ứng dụng có thêm panel **PC AI (Whisper trên Windows)** trong khu vực Karaoke.

## Cài đặt

1. Tải repository Music_Video về máy Windows (nút Code → Download ZIP), giải nén.
2. Cài **Python 3.10+** và **FFmpeg** trong PATH. Kiểm tra ở CMD: `python --version` và `ffmpeg -version`.
3. Bấm đúp `MO_MUSIC_STUDIO_PC.bat` trong thư mục repo. Lần đầu tự cài `faster-whisper`; model Whisper được tải ở lượt xử lý đầu.
4. Mở `http://127.0.0.1:8765` trên **chính máy Windows**.
5. Ở thẻ **Karaoke → PC AI**, chọn file MP3/WAV, ngôn ngữ, bấm **Tạo sub bằng PC**.
6. Xem và sửa lời, bấm **Đưa vào Music Studio** để preview, căn chỉnh và xuất video với hiệu ứng của web. **Tải LRC** để lưu riêng.

## GPU / máy yếu

Mặc định model `small`, backend tự chọn thiết bị. Khi GPU không tương thích CUDA/CTranslate2, thử CMD:
```bat
set KARAOKE_DEVICE=cpu
set KARAOKE_COMPUTE_TYPE=int8
set KARAOKE_WHISPER_MODEL=base
python pc_bridge.py
```
Nếu model quá nặng, chọn `tiny` hoặc `base`. Không cam kết GTX 1050 Ti chạy GPU với mọi phiên bản CUDA/cuDNN: cần kiểm tra thực tế.

## Giới hạn & an toàn

- Đã kết nối trình duyệt ↔ Python local bằng API. **Chưa tích hợp tự động** UVR/Applio, karaoke-gen renderer, nâng độ chính xác mốc *từng từ*, hay xuất offline FFmpeg. Đây là MVP liên kết, không phải hệ thống karaoke hoàn chỉnh.
- Faster-whisper nhận diện từng đoạn/câu, không căn chính xác từng chữ hát; kết quả cần nghe lại. Track nhiều bài cần tạo LRC từng bài rồi nhập đúng bài; nút **Đưa vào Music Studio** hiện thay trường phụ đề của timeline hiện hành.
- API chỉ nghe `127.0.0.1`; giới hạn file 100 MB, không gửi nhạc tới server từ xa. Model sẽ tải từ nguồn phát hành trong lần cài đầu.
- Không mở cổng máy ra Internet, không chạy dịch vụ Python với quyền Administrator. Mã nguồn và điều kiện tải model nên được kiểm tra trước khi phân phối sản phẩm.
- Chưa xác nhận chạy trên máy Windows của bạn. Có thể chạy test cho formatter bằng `python -m unittest discover -s pc_tests`.

## Hướng nâng cấp

Backend job queue/progress + Faster-Whisper word timestamps + lựa chọn GPU, UVR tách vocal, auto alignment và FFmpeg offline renderer. Phần này cần truy cập dự án karaoke-gen trên máy và model đã cài để nối đúng API thay vì phỏng đoán.
