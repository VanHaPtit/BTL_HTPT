# Giao diện Máy khách (Frontend)

Đây là thư mục chứa toàn bộ mã nguồn giao diện (Frontend) của ứng dụng. Chịu trách nhiệm hiển thị trang web, cung cấp trình soạn thảo văn bản và kết nối trực tiếp với Máy chủ (Backend) qua cả luồng tĩnh (HTTP) và luồng thời gian thực (WebSocket).

---

## 1. Công nghệ sử dụng

* **React.js:** Thư viện giao diện chính.
* **Vite:** Công cụ build siêu tốc giúp khởi chạy dự án nhanh chóng.
* **Tiptap Editor:** Trình soạn thảo văn bản mạnh mẽ (Rich-text Editor).
* **Tailwind CSS:** Thiết kế giao diện (UI) hiện đại, gọn gàng.
* **Axios & STOMP.js:** Xử lý kết nối gửi/nhận dữ liệu với Backend.

---

## 2. Các chức năng chính do Frontend đảm nhận

* **Quản lý phiên đăng nhập:** Lưu trữ Token (JWT) để xác thực người dùng an toàn.
* **Màn hình Dashboard:** Liệt kê các tài liệu cá nhân, cho phép tạo mới, xóa và chia sẻ quyền.
* **Trình soạn thảo văn bản:** Bắt từng thao tác gõ phím của người dùng và đóng gói gửi lên Server qua đường WebSocket siêu tốc.
* **Hiển thị trực tiếp:** Nhận tin nhắn từ Server và vẽ lên màn hình các chữ cái, con trỏ chuột, cùng danh sách những người đang online chung phòng.

---

## 3. Cấu trúc thư mục chính

* `/src/api` : Chứa các hàm dùng để gọi API (HTTP) lên Backend (đăng nhập, lấy danh sách file).
* `/src/components` : Chứa các nút bấm, thanh công cụ, bảng biểu dùng chung trong hệ thống.
* `/src/pages` : Các màn hình lớn (Màn hình Đăng nhập, Màn hình Dashboard, Màn hình Editor).
* `/src/collab` : Chứa logic cực kỳ quan trọng để dịch thao tác gõ phím thành tín hiệu gửi qua WebSocket.

---

## 4. Hướng dẫn chạy Frontend 

Để chạy được giao diện lên máy tính, bạn cần cài đặt **Node.js (phiên bản 18 trở lên)**.

**Bước 1:** Mở màn hình lệnh (Terminal) tại thư mục `frontend` này và cài đặt thư viện:

```powershell
npm install
```

**Bước 2:** Chạy ứng dụng lên:

```powershell
npm run dev
```

**Lưu ý:** Giao diện sẽ chạy ở địa chỉ `http://localhost:5173`. Tuy nhiên, để đăng nhập và dùng được, bạn **BẮT BUỘC** phải bật thư mục `backend` chạy song song
