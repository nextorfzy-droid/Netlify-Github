# AUTO OLM — GitHub + Netlify package (updated)

Gói này ghép giao diện AUTO OLM đang dùng với các luồng đăng nhập, tải bài, gửi bài và tra cứu đáp án theo các route trong hai file HTML bạn cung cấp. Giao diện chính được giữ ở `public/index.html`; backend proxy nằm trong `netlify/functions/`.

## Đã cập nhật

- Màn hình đăng nhập luôn khóa workspace cho đến khi `GET /session` xác nhận `authenticated: true`.
- `POST /login` nhận form-urlencoded gồm `username`, `password`; chỉ mở giao diện khi backend trả `ok: true` và `authenticated: true`.
- `POST /panel/exercises` gửi `{ account_id }`; danh sách bài hỗ trợ phần tử dạng chuỗi hoặc object (`id`, `title`, `name`, `url`, `expired`...).
- `POST /panel/do-exercises` gửi `{ account_id, exercises, time_spent }`; thời gian mặc định 150 giây, giới hạn 10–3600 giây.
- `POST /panel/get-answers` gửi `{ exercise_url, account_id }`.
- Các Functions được đặt ngoài thư mục xuất bản (`public`) để không công khai mã backend dưới dạng tệp tĩnh.
- Không lưu mật khẩu OLM trong localStorage, mã HTML hoặc repository.

## Cấu trúc repository

```text
public/
  index.html
  assets/
    css/style.css
    js/app.js
    js/login.js
    js/exercises.js
    video.mp4
netlify/
  functions/
    login.mjs
    logout.mjs
    session.mjs
    exercises.mjs
    do-exercises.mjs
    get-answers.mjs
    _panel.mjs
    _shared.mjs
netlify.toml
.env.example
README.md
```

## Bước 1 — Đưa ZIP lên GitHub bằng điện thoại

1. Tải ZIP về và giải nén bằng ứng dụng quản lý tệp trên điện thoại.
2. Mở https://github.com và đăng nhập.
3. Nhấn dấu `+` → **New repository**.
4. Đặt tên `auto-olm`, chọn **Private** (khuyên dùng), rồi **Create repository**.
5. Trong repository mới, chọn **Add file → Upload files**.
6. Mở thư mục đã giải nén, chọn toàn bộ nội dung bên trong (các thư mục `public`, `netlify` và các tệp cấu hình), tải lên. Không tải riêng file ZIP và không để toàn bộ dự án nằm trong một thư mục lồng thêm.
7. Kéo xuống, nhập commit message `Upload AUTO OLM`, nhấn **Commit changes**.

Nếu giao diện GitHub trên điện thoại không hiện tải thư mục, mở Chrome → menu ⋮ → **Trang web cho máy tính**, sau đó làm lại bước 5–7.

## Bước 2 — Kết nối repository với Netlify

1. Mở https://app.netlify.com và đăng nhập.
2. Chọn **Add new project** → **Import an existing project**.
3. Chọn **GitHub** và cấp quyền cho Netlify truy cập repository `auto-olm` (chỉ cấp quyền repository cần dùng nếu GitHub cho chọn).
4. Chọn repository `auto-olm` và branch `main`.
5. Build settings phải là:
   - Build command: để trống
   - Publish directory: `public`
   - Functions directory: `netlify/functions` (đã cấu hình trong `netlify.toml`)
6. Nhấn **Deploy**. Mỗi lần commit/push lên branch đã kết nối, Netlify sẽ tự build và deploy lại.

## Bước 3 — Kiểm tra route sau deploy

Mở domain Netlify của bạn và kiểm tra:

- `/` hiển thị màn hình đăng nhập AUTO OLM.
- `/session` có route Function; khi chưa cấu hình upstream có thể trả `503` kèm thông báo cấu hình, nhưng không nên trả `404`.
- Gửi `GET /login` có thể trả `405` vì route chỉ chấp nhận POST.
- Các route bài tập chỉ dùng được sau khi có phiên đăng nhập hợp lệ.

## Bước 4 — Cấu hình backend OLM hợp lệ

Trong Netlify → **Project configuration** → **Environment variables**, tạo các biến sau với URL HTTPS của backend tích hợp mà bạn sở hữu hoặc được phép sử dụng:

| Biến | Phương thức | Hợp đồng cần có |
|---|---|---|
| `OLM_LOGIN_URL` | POST form-urlencoded | Nhận `username`, `password`; trả `authenticated: true` và session `Set-Cookie` |
| `OLM_LOGOUT_URL` | POST | Nhận cookie phiên; trả `loggedOut: true` hoặc `ok: true` |
| `OLM_SESSION_URL` | GET | Nhận cookie phiên; trả `authenticated: true/false` |
| `OLM_EXERCISES_URL` | POST JSON | Nhận `{ account_id }`; trả `{ success: true, exercises: [...] }` |
| `OLM_DO_EXERCISES_URL` | POST JSON | Nhận `{ account_id, exercises, time_spent }`; trả kết quả thật |
| `OLM_GET_ANSWERS_URL` | POST JSON | Nhận `{ exercise_url, account_id }`; trả dữ liệu được phép truy cập |

Sau khi thêm biến, vào **Deploys** → **Trigger deploy** → **Deploy site**. Không đặt các URL giả trong biến môi trường. `.env.example` chỉ là mẫu tên biến, không phải cấu hình hoạt động.

## Giới hạn quan trọng

Hai file HTML nguồn cho biết cách giao diện gửi request và cấu trúc payload, nhưng không cung cấp backend OLM, API endpoint được xác minh, cơ chế cấp session hay thuật toán xử lý bài. Token CSRF tĩnh và tài khoản mẫu trong HTML nguồn không được tái sử dụng vì có thể hết hạn hoặc là dữ liệu minh họa. Vì vậy gói này hoàn thiện frontend + Netlify proxy + route và cấu trúc triển khai, **chưa thể đăng nhập OLM thật, tự nộp bài hay lấy đáp án thật cho đến khi cấu hình backend upstream hợp lệ**. Không nhập mật khẩu vào dịch vụ proxy không rõ nguồn gốc.

## Tài liệu tham khảo

- Netlify deploy từ Git repository: https://docs.netlify.com/start/quickstarts/deploy-from-repository/
- Netlify Functions configuration: https://docs.netlify.com/build/functions/configuration/
