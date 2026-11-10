# Music Studio · Video + Karaoke

Ứng dụng web local: nhạc + ảnh + nhiều lớp hiệu ứng + sub karaoke → video. Không cần Python/Node để dùng. Không tải file cá nhân lên máy chủ; mọi xử lý media ở trình duyệt.

## Mở app

Sau khi bật GitHub Pages, địa chỉ dự kiến: **https://vn8690-create.github.io/Music_Video/**.

Nếu chưa bật: vào **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. Chờ GitHub triển khai. Repo có sẵn index.html và .nojekyll.

Có thể tải cả repo về máy tính (giữ toàn bộ các file HTML/JS/CSS cùng thư mục) rồi mở index.html; để dùng trên iPhone nên mở trang HTTPS bằng Safari, Android bằng Chrome. Trình duyệt trong Facebook/Zalo có thể hạn chế chọn file, âm thanh hoặc tải xuống.

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
- Chuyển tab, khóa màn hình hoặc gián đoạn âm thanh sẽ tạm giữ phiên xuất; quay lại để tiếp tục từ mốc đã ghi. Đây không phải xuất video chạy nền. App thử giữ màn hình sáng nếu trình duyệt cho phép; không bảo đảm hệ điều hành luôn giữ ứng dụng chạy.
- Xuất theo thời gian thực, không phải renderer offline cố định từng frame. Thời gian xuất bằng độ dài nhạc; bài dài hoặc nhiều ảnh lớn có thể vượt bộ nhớ điện thoại.
- Khi thiếu tính năng ghi video, app vẫn cho xem trước và giải thích cách dùng trình duyệt mới/máy tính để xuất. Không xin quyền camera/microphone.
- Service worker lưu giao diện dùng lại offline sau lần mở HTTPS thành công; không tự lưu các file nhạc/ảnh/sub đã chọn. Tải video/LRC trước khi đóng tab.

## Karaoke

ASS có `\\k`/`\\kf` hoặc enhanced LRC: tô theo mốc từ. LRC/SRT chỉ có thời gian câu: tô chữ ước lượng. ASS chỉ đọc lời/timing, không giữ toàn bộ tag định dạng nâng cao. TXT chưa có mốc: dùng **Căn từng câu** và tải LRC. Từ V5.4 có nút Tạo sub AI thử nghiệm ngay trong thẻ Karaoke (xem hướng dẫn bên dưới).

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


## Studio V4 — bố cục, logo và đĩa nhạc

- Giao diện chia thành **Tư liệu / Hiệu ứng / Bố cục / Karaoke**. Khung video và danh sách lớp luôn ở khu vực chính.
- Cột phổ, sóng và vòng nhạc có vị trí, kích thước, độ rõ độc lập. Vào **Bố cục**, chọn lớp, bật hiện lớp, rồi chỉnh X/Y hoặc các nút đặt nhanh. Chọn lớp từ danh sách dưới khung cũng được.
- Bật **Kéo trên video** để kéo lớp bằng chuột hoặc ngón tay. Trên điện thoại tính năng này tắt mặc định để vẫn cuộn trang dễ dàng; luôn có thanh X/Y thay thế. Khi canvas được chọn có thể dùng phím mũi tên, Shift để dịch nhanh.
- **Thêm logo** nhận ảnh PNG/WebP/JPG. PNG nền trong giữ nguyên alpha và tỉ lệ ảnh. Chỉnh vị trí, cỡ và độ rõ; gỡ logo nếu không muốn dùng.
- **Thêm đĩa xoay** tạo đĩa vinyl có vân rãnh và nhãn ảnh. Mặc định lấy ảnh nền đang chiếu; có thể chọn ảnh nhãn riêng. Tốc độ 0–45 vòng/phút; 0 dừng xoay. Đĩa đi theo thời gian bài nhạc nên dừng khi tạm dừng và khớp lại khi tua.
- **Hoàn tác/Làm lại** áp dụng cho thay đổi bố cục, không phải lịch sử toàn bộ dự án. Khung chọn là lớp DOM để chỉnh, không được ghi vào video. Các vị trí được lưu theo phần trăm khung hình trong phiên làm việc; đổi tỉ lệ video sẽ giữ các lớp bên trong khung.
- Logo/ảnh nhãn được giữ trong RAM của tab, không gửi lên server. Bản này chưa lưu toàn bộ dự án khi đóng tab; cần tải video trước khi thoát.

Không phải DAW/NLE đầy đủ: xuất video vẫn theo thời gian thực bằng trình duyệt. Kiểm tra bằng engine Chromium/WebKit và màn hình giả lập không thay thế thử trên iPhone/Android thật.


## V4.1 — giữ lượt xuất khi chuyển tab

Bản cũ hủy lượt xuất khi tab bị ẩn. Bản này tạm dừng MediaRecorder và nguồn nhạc ở cùng mốc; khi quay lại app thử tiếp tục. Nếu trình duyệt cần thao tác để mở lại âm thanh, bấm **Tiếp tục xuất**. Có thể chủ động **Tạm dừng xuất**; trường hợp này app không tự tiếp tục khi đổi tab rồi quay lại.

Tiến độ chỉ giữ trong RAM của phiên tab đang mở. Không đóng/tải lại trang. Nếu hệ điều hành buộc đóng trình duyệt hoặc giải phóng tab thì không thể khôi phục; khóa màn hình lâu trên iPhone/Android có thể gây ra điều này. App không xuất tiếp khi trang bị ẩn, không dùng mẹo bật âm thanh để vượt cơ chế tiết kiệm pin.

Khi recorder tự kết thúc hoặc không còn khả năng tiếp tục, app cố cho tải phần đã ghi với tên **video-karaoke-chua-du**, ghi rõ chưa đủ bài. File đã ghi một phần không đồng nghĩa đã xuất toàn bộ. Nút **Hủy xuất** vẫn hủy theo yêu cầu người dùng.

Kiểm thử che/hiện trang được mô phỏng bằng sự kiện visibility và việc giữ đồng hồ được kiểm tra với recorder thật. Không phải thử khóa màn hình trên điện thoại thật.



## V5 — Mẫu Album đĩa than

Ở **Tư liệu**, bấm **Dùng mẫu Album đĩa than**, hoặc vào **Bố cục → Mẫu video**. Thêm ảnh chân dung, tên bài, nghệ sĩ, tên kênh và dòng mô tả. Có ba tông Trắng ngọc / Đen than / Hồng phấn. Ảnh hòa vào nền, đĩa xoay và thanh thời gian theo nhạc.

Đĩa, cột phổ, sóng, vòng và logo tiếp tục dùng hệ thống lớp cũ: chỉnh vị trí/cỡ/độ rõ, ảnh nhãn, tốc độ và kéo trên canvas. Đổi khung ngang/dọc/vuông sẽ sắp lại mẫu; **Sắp lại vị trí theo khung hình** trả về vị trí gợi ý. Sub ASS/LRC/SRT có thời gian được ghi vào video, phần album dành vùng dưới cho lời. Tắt Hiện sub để dùng toàn khung.

Bản GitHub Pages dựng trong trình duyệt. V5.4 bổ sung Whisper chạy bằng WebAssembly trong trình duyệt, không cần Python. Vẫn có thể nhập sub đã căn từ Karaoke Studio/bản PC hoặc căn TXT bằng tay. Chức năng giữ lượt xuất khi chuyển tab của V4.1 vẫn được giữ.

Nếu thấy V4.1, tải lại trang để nhận giao diện V5; service worker có bộ nhớ giao diện mới. Các file cá nhân không được đưa lên repo.


## V5.1 — Danh sách nhiều bài hát

Ở **Tư liệu → Thêm nhiều bài**, chọn nhiều MP3/WAV/M4A/FLAC một lượt. Chọn thêm lần nữa để nối vào cuối danh sách. Dùng ↑ / ↓ đổi thứ tự, × xóa bài, ▶ nghe từ bài đó sau khi đã chọn ảnh. **Tạo video** xuất toàn bộ danh sách liên tiếp vào một video. Ảnh và hiệu ứng tiếp tục chạy trên timeline chung của album.

Bật **Hiện tên bài đang phát** để lấy tên từ tên file cho từng bài. Thanh tua và đồng hồ ngoài khung là thời gian toàn album; thanh thời gian trong mẫu Album là thời gian của bài hiện tại.

Mỗi bài có nút **Thêm sub / Đổi sub**: nhập ASS/LRC/SRT/VTT đã có timing tính từ đầu bài đó. App tự cộng mốc đầu bài và dời sub khi đổi thứ tự. Có thể tải LRC tổng từ thẻ Karaoke. Ô lời trong thẻ Karaoke vẫn áp dụng cho **toàn album**: bấm Áp dụng sẽ thay các sub đã gắn từng bài. Nếu đổi danh sách sau khi nhập sub toàn album, cần nhập lại sub tổng; sub gắn từng bài được giữ. TXT không có mốc vẫn cần căn lời trước.

Âm thanh được giải mã từng bài, giữ một bản PCM cho mỗi bài và lập lịch cùng đồng hồ Web Audio; không ghép thêm một bản PCM khổng lồ. MP3 được phát theo nội dung đã giải mã, không tự xóa khoảng im lặng có sẵn trong file. Trình duyệt vẫn cần RAM cho toàn bộ danh sách: giới hạn PCM hiện tại là 256 MiB trên thiết bị con trỏ chạm và 768 MiB trên máy tính. Khi đạt giới hạn, app giữ những bài đã thêm và báo chia album. Không cam kết số bài cố định vì độ dài/số kênh/tần số lấy mẫu khác nhau. Đóng tab sẽ mất danh sách vì app không lưu file nhạc cá nhân.

Xuất vẫn theo thời gian thực. Giữ tab mở; việc tạm giữ và tiếp tục lượt xuất của V4.1 hoạt động cho cả danh sách.


## V5.2 — Nhiều kiểu chuyển cảnh trong một video

Vào **Hiệu ứng → Chọn một hoặc nhiều kiểu**, tick Hòa tan / Quét ngang / Trượt / Vòng tròn / Cắt thẳng. Chọn **Luân phiên** để dùng theo thứ tự các ô, hoặc **Ngẫu nhiên** để xáo từng lượt, tránh hai kiểu giống nhau liền nhau khi chọn từ hai kiểu trở lên. **Chọn tất cả** bật cả năm; bỏ bớt để phối theo ý. Luôn giữ ít nhất một kiểu được chọn.

Mỗi lần đổi ảnh dùng một kiểu đã chọn. Lượt ngẫu nhiên được giữ ổn định khi tua, tạm dừng và xuất lại trong cùng phiên; bấm **Đảo lượt ngẫu nhiên** để đổi cách phối. Chuyển cảnh áp dụng cho cả bố cục Album và ảnh toàn màn hình, trên timeline chung của danh sách bài. Chỉ có một ảnh thì chọn nhiều kiểu không tạo thêm cảnh mới.


## V5.3 — Mờ, lật, xoay và hòa trộn

Hiện có **15 kiểu**: năm kiểu cơ bản, Mờ mềm, Zoom hòa tan, Zoom + mờ, Lật ngang, Lật dọc, Xoay nghiêng, Xoáy vòng, Đẩy lên, Hòa trộn sáng (screen), Hòa trộn tối (multiply). Chọn một hoặc nhiều ô để phối luân phiên/ngẫu nhiên. Bộ **Nhẹ nhàng** chọn hòa tan/mờ/zoom/xoay; bộ **Năng động** chọn zoom mờ/lật/xoáy/đẩy/hòa sáng.

Chỉnh thời lượng 0,2–2,5 giây, nhịp chuyển mượt hoặc đều, và độ mạnh. Nếu đổi ảnh nhanh, thời lượng chuyển tự giới hạn ở 45% khoảng đổi ảnh để tránh chồng cảnh. Các lớp phổ nhạc/logo/đĩa và karaoke được vẽ sau phần chuyển ảnh, nên không bị lật hay làm mờ theo cảnh. Mẫu Album vẫn dùng được.

Các kiểu lật là phép mô phỏng bằng canvas 2D, không phải dựng mô hình 3D. Thiết bị không có Canvas filter dùng cách thu nhỏ/phóng mịn để tạo mờ gần đúng. Khi xuất nhiều hiệu ứng nặng, chọn chất lượng phù hợp với thiết bị; đây vẫn là trình dựng video chạy theo thời gian thực, không phải toàn bộ tính năng CapCut.


## V5.3.1 — Nhập tên bài ngay trong mẫu Album

Vào **Bố cục → Album đĩa than → Tên bài hát trên video** để nhập tên hiển thị phía trên đĩa. Ô này đồng bộ với ô tên ở **Tư liệu**. Chưa nhập hoặc xóa hết thì không vẽ chữ mẫu “Tên bài hát”. Tên tự nhập áp dụng cho cả video; nếu muốn tự đổi theo từng bài trong album, bật lại **Tư liệu → Hiện tên bài đang phát khi có nhiều bài**.


## V5.3.2 — Trạng thái nhập nhạc trên điện thoại

Ngay dưới nút chọn nhạc có trạng thái nhận file, đọc, giải mã, phân tích và lỗi. Mỗi bài đọc thành công hiện ngay trong danh sách; file lỗi không xóa các bài đã có. App giữ file được chọn trong lúc đọc, mở âm thanh từ thao tác chọn file và giới hạn thời gian chờ đọc/giải mã. Nếu phân tích nhịp bằng Web Audio không chạy được, app dùng mức âm lượng để tạo hiệu ứng, giữ nguyên âm thanh gốc. File iCloud/Drive cần tải về máy trước nếu báo chưa đọc được; codec không được trình duyệt hỗ trợ cần chuyển sang MP3/WAV, không chỉ đổi đuôi.



## V5.4 — Tạo sub AI trên điện thoại (bản thử)

1. Mở Studio bằng HTTPS trong Safari/Chrome, thêm nhạc ở **Tư liệu**.
2. Vào **Karaoke → Tạo sub AI**, chọn bài và ngôn ngữ Việt / Nhật / Anh / tự nhận diện.
3. Lần đầu chọn **Thử 30 giây**, nhập giây bắt đầu đoạn có giọng hát. Khi chạy ổn mới chọn **Cả bài** (tối đa 10 phút).
4. Có lời chuẩn thì mở **Có lời chuẩn để đối chiếu?**, dán đúng lời của đoạn đang chọn, mỗi câu một dòng. Không dán cả bài khi chỉ thử 30 giây.
5. Bấm **Tạo sub AI**. Giữ tab mở, dùng Wi-Fi lần đầu để tải bộ AI. Có tiến độ, thời gian đã chạy và **Hủy AI** để dừng worker, giải phóng model. Không tải lại/đóng tab trước khi lưu.
6. Xem bản nháp, **Nghe câu**, sửa lời/mốc, bỏ câu AI nghe nhầm. Câu đối chiếu chưa khớp có mốc trống; phải sửa hoặc bỏ câu đó trước khi áp dụng.
7. **Áp dụng sub AI** để đưa vào video hoặc **Tải bản nháp LRC** để giữ file. Áp dụng chỉ thay vùng đã xử lý của bài đã chọn, giữ sub các bài khác và các đoạn ngoài vùng đó.

Nhận diện dùng `Xenova/whisper-tiny` đa ngôn ngữ, q8, WASM một luồng, Transformers.js 3.8.1; revision model cố định trong worker. Model/thư viện tải từ Hugging Face và jsDelivr, có thể được trình duyệt lưu cache. Âm thanh được lấy mẫu lại 16 kHz trên máy, chỉ chuyển nội bộ sang Web Worker; không gửi file nhạc tới dịch vụ AI, không dùng API key hoặc dịch vụ trả phí. Các máy chủ tải model vẫn nhận yêu cầu mạng thông thường. Mở `file://` không chạy AI; hãy dùng link HTTPS hoặc server localhost.

Lời AI gốc có mốc từ do model dự đoán. Khi dán lời chuẩn hoặc sửa lời/mốc thủ công, app dùng mốc câu và tô từ ước lượng; không coi đối chiếu văn bản là forced alignment chính xác. Nhạc nền, luyến láy, đoạn không hát và ngôn ngữ đều có thể gây sai hoặc lời bịa. Hãy nghe lại. Bản này không tách vocal, không bảo đảm khớp mọi bài và không cam kết chạy nền trên iOS. Hiệu năng thực tế cần thử trên điện thoại của bạn.

Kiểm tra và giới hạn: xem [VALIDATION_AI.md](VALIDATION_AI.md).

## V5.5 — Ảnh và video trong cùng MV
Trong Tư liệu, chọn **Thêm ảnh / video**. Mỗi clip có mốc Từ–Đến, thời lượng hiện trong MV, lặp đoạn cắt và tốc độ 0,25×–4×. Đổi tốc độ tự điều chỉnh thời lượng cảnh theo tỷ lệ; vẫn có thể nhập lại thời lượng. Tắt lặp sẽ giữ khung hình cuối của đoạn cắt. Tiếng clip luôn tắt; nhạc và karaoke dùng đồng hồ bài hát.

Có thể sắp xếp ảnh xen clip, dùng các chuyển cảnh, logo, đĩa và karaoke hiện có. Ưu tiên MP4 H.264. Codec MOV/HEVC/WebM tùy trình duyệt. Giới hạn 6 clip trên điện thoại, 12 trên máy tính; canvas nền tối đa cạnh 1280 để giảm bộ nhớ. Slow motion dùng khung hình gốc, chưa có nội suy AI (đường cong tốc độ có từ V5.6). Giữ trang hiện khi xuất.

Kiểm tra: 8 unit tests và 16 browser tests chạy đạt trên Chromium với viewport Android, gồm video MP4 thật, cắt/loop/hold, tốc độ 0,5×, reorder/remove, pause/resume và xuất. Chưa xác nhận trên iPhone vật lý.

## V5.6 — Đường cong tốc độ
Chọn clip → Đường cong tốc độ → Tăng nhanh → Slow, Slow → Tăng nhanh, Nhanh → Slow → Nhanh hoặc Tự chỉnh. Năm mốc 0/25/50/75/100% của thời lượng cảnh chỉnh được từ 0,25× đến 4×; biểu đồ nối mượt giữa các mốc. Chọn Tốc độ cố định để trở lại chế độ cũ.
Thời lượng cảnh tự đổi theo tốc độ trung bình để giữ nguyên lượng hình gốc đã đi qua. Có thể nhập lại thời lượng để lặp hoặc giữ hình cuối. Thời gian nguồn được tính từ tích phân đường cong, nên tua/tạm dừng không tích lũy sai số. Nhạc và sub không đổi tốc độ.
Đã chạy đạt 11 unit tests. Có browser regression cho preset, sửa mốc, tua, hold, pause/resume và xuất; kiểm tra trình duyệt được giao cho GitHub Actions do sandbox cục bộ chặn khởi chạy Chromium.

## V5.6.1 — Giảm tải khi dùng video dài
- Chỉ đọc metadata và khung hình đầu khi nhập; giữ poster và URL của file gốc. Không nạp sẵn tất cả phim.
- Chỉ giữ bộ giải mã của cảnh hiện tại; chuyển cảnh dùng canvas cuối của cảnh trước. Không await video.play() vô thời hạn khi khởi động.
- Nhận biết khung hình sẵn sàng qua canplay/seeked hoặc trạng thái hiện tại, không phụ thuộc riêng loadeddata. Có timeout và nút hủy đọc file.
- Tính tuổi cảnh liên tục, tránh sai lệch tốc độ khi tua đường cong.
- Unit tests: 14 đạt. Browser regression bổ sung hai MP4 H.264 thực dài 420/540 giây, thử tua gần cuối, phát qua hai cảnh, giải phóng decoder và hủy nhập. Các fixture dài được tạo từ clip mẫu nhỏ nên kiểm tra thời lượng/lifecycle, không mô phỏng tải giải mã 4K.
- Chưa xác nhận trên iPhone vật lý hoặc file gốc của người dùng. 4K/HEVC vẫn có thể vượt khả năng thiết bị; ưu tiên H.264 720p/1080p khi gặp lỗi codec/bộ nhớ.

## V5.6.2 — Giảm giật sát điểm chuyển video
- Chặn việc gọi play() phát lại từ đầu khi video đã chạm EOF nhưng đồng hồ cảnh chưa chuyển. Chỉ giữ khung cuối trong phần đuôi khung hình, rồi chuyển/lặp một lần.
- Độ lệch nhỏ được bù tốc độ tối đa 6%, thay vì seek liên tục. Seek vẫn dùng cho tua chủ động, đổi cảnh/vòng lặp và độ lệch lớn, có khoảng nghỉ giữa các lần sửa.
- Chuẩn bị metadata/khung đầu của clip kế tiếp trước tối đa 1,2 giây, chỉ khi tổng pixel nguồn đủ nhẹ: 2,1MP trên điện thoại hoặc 8,4MP trên desktop. Tối đa hai decoder trong khoảng chuyển, giải phóng standby khi tạm dừng. Các cặp nặng/4K dùng đường một decoder để hạn chế bộ nhớ; có thể vẫn có trễ mở clip tùy thiết bị.
- Nhạc và karaoke dùng đồng hồ âm thanh như trước. Không thêm nội suy khung hình AI.
- Kiểm tra cục bộ: 18 unit tests và các ca browser về chuẩn bị cảnh tiếp, số lần seeking/play ở đuôi clip, xuất video, tốc độ, nhập/hủy và video dài. Browser CLI cục bộ cần chạy riêng từng ca do giới hạn tái sử dụng context ở Chromium single-process; CI chạy bộ Chromium/WebKit chuẩn. Chưa thử file gốc và thiết bị vật lý của người dùng.

## 5.7 — NVS Aurora / Pexels

The Aurora workspace adds a responsive cyan/violet theme and a Pexels stock-video tab. Enter your own existing Pexels API key in the password field, search a topic (English keywords work well), choose orientation/resolution, preview/select clips or auto-select up to the device limit, then **Thêm vào MV**. Each imported clip uses the selected scene duration and can be trimmed, reordered, looped or speed-ramped in **Tư liệu**. Auto-selection follows search ranking; it does not analyze song meaning.

The key lives only in page memory, including the short-lived search cache; it is never written to local/session storage, URLs, source code or the service worker. Reload or **Xóa key khỏi phiên** clears it. Searches send the key only to `https://api.pexels.com/v1/videos/search` via Authorization. The public static app uses the user's key directly; it is not a shared server credential. Do not hard-code a production key when deploying for other users.

Downloads use validated HTTPS CDN URLs, without Authorization, and become local blob-backed video assets before entering the renderer. Imports are sequential and cancellable, preserve prior assets, and enforce 6 mobile / 12 desktop clips, 50/120 MiB per download and 120/360 MiB per batch. Resolution is the nearest available short-edge size. Actual API access depends on the user's valid key, quota and Pexels availability/CORS. Pexels results retain creator/source links; **Tải danh sách nguồn video** exports credits for the video's description. Review the linked Pexels license for the intended use.

Tests mock API responses (no real key required) and import/decode an actual MP4 fixture. They verify Authorization routing, caching, duplicate filtering, cancellation, invalid-key recovery, session-only key handling and responsive layout. Existing playback/export/karaoke regression tests remain enabled.
