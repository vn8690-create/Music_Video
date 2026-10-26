# Music Video + Karaoke

Ứng dụng web local: nhạc + ảnh + nhiều lớp hiệu ứng + sub karaoke → video. Không cần Python/Node để dùng. Không tải file cá nhân lên máy chủ; mọi xử lý media ở trình duyệt.

## Mở app

Sau khi bật GitHub Pages, địa chỉ dự kiến: **https://vn8690-create.github.io/Music_Video/**.

Nếu chưa bật: vào **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. Chờ GitHub triển khai. Repo có sẵn index.html và .nojekyll.

Có thể tải `index.html` về máy tính và mở trực tiếp; để dùng trên iPhone nên mở trang HTTPS bằng Safari, Android bằng Chrome. Trình duyệt trong Facebook/Zalo có thể hạn chế chọn file, âm thanh hoặc tải xuống.

## Phối nhiều hiệu ứng

1. Chọn nhạc và nhiều ảnh.
2. Chọn preset làm nền, sau đó tick thêm/bỏ từng hiệu ứng. Ví dụ: **Zoom theo bass + Glow + Mưa + Sao + Cột phổ + Vòng nhạc** cùng lúc.
3. Chọn khung hình ngang/dọc/vuông, chất lượng và kiểu chuyển cảnh.
4. Mở ASS/LRC/SRT hoặc dán lời. Xem thử rồi xuất video.

Có 15 lớp độc lập: zoom bass, rung, glow, RGB, zoom trôi, xoay, VHS, glitch cắt lát, sao, mưa, tuyết, bokeh, cột phổ, sóng và vòng nhạc. Chọn preset mới sẽ thay bộ hiệu ứng hiện tại; tick các ô để tự phối. Màu phim là một lựa chọn riêng.

## Điện thoại

- Mặc định **480p**, có thể chọn 720p/1080p khi máy đủ mạnh. Nên dùng 2–4 lớp nhẹ trước; bật tất cả có thể giật trên máy yếu.
- iPhone: Safari bản mới. Chọn file trong **Tệp / Photos**. Sau khi xuất, **Chia sẻ / Lưu vào Tệp** hoặc bấm link tải. Có thể thêm trang vào màn hình chính bằng menu Chia sẻ.
- Android: Chrome bản mới. Có thể dùng menu trình duyệt để thêm/cài app lên màn hình chính.
- App tự kiểm tra `MediaRecorder`, ghi canvas và codec. Ưu tiên MP4 nếu có; nếu không thì WebM. Đây không phải bộ chuyển đổi mọi định dạng sang MP4.
- Giữ tab hiện, không khóa màn hình, đổi app hay nhận cuộc gọi lúc xuất. App thử giữ màn hình sáng nếu trình duyệt cho phép; không bảo đảm hệ điều hành luôn giữ ứng dụng chạy.
- Xuất theo thời gian thực, không phải renderer offline cố định từng frame. Thời gian xuất bằng độ dài nhạc; bài dài hoặc nhiều ảnh lớn có thể vượt bộ nhớ điện thoại.
- Khi thiếu tính năng ghi video, app vẫn cho xem trước và giải thích cách dùng trình duyệt mới/máy tính để xuất. Không xin quyền camera/microphone.
- Service worker lưu giao diện dùng lại offline sau lần mở HTTPS thành công; không tự lưu các file nhạc/ảnh/sub đã chọn. Tải video/LRC trước khi đóng tab.

## Karaoke

ASS có `\\k`/`\\kf` hoặc enhanced LRC: tô theo mốc từ. LRC/SRT chỉ có thời gian câu: tô chữ ước lượng. ASS chỉ đọc lời/timing, không giữ toàn bộ tag định dạng nâng cao. TXT chưa có mốc: dùng **Căn từng câu** và tải LRC. Không có nhận lời tự động bằng AI.

Offset dương làm sub xuất hiện muộn. Thay hiệu ứng không đổi mốc từ. Nhạc không qua tách giọng/đổi pitch; được mã hóa lại theo codec trình duyệt.

## Kiểm tra cho người phát triển

```sh
npm ci
npm test
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

WebKit/Chromium được chạy ở kích thước và chế độ chạm của iPhone/Android. Đây là kiểm thử engine và giả lập màn hình, không thay thế kiểm thử Safari/Chrome trên điện thoại thật. Không hứa hỗ trợ mọi iOS/Android cũ.

Nguồn tham khảo API: [WebKit MediaRecorder](https://webkit.org/blog/11353/mediarecorder-api/), [Safari 18.4 codecs](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/), [Wake Lock](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock/request).
