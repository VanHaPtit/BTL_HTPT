# BTL_HTPT - Hệ thống soạn thảo văn bản cộng tác thời gian thực

Mục tiêu của dự án là xây dựng một trang web giống như Google Docs. Ở đó, nhiều người có thể mở và cùng gõ chung một tài liệu qua mạng, mọi chữ được gõ ra sẽ hiện lên màn hình của những người khác ngay lập tức. Đồ án giúp làm quen với việc đồng bộ dữ liệu, dùng WebSocket để truyền tin theo thời gian thực, và cách xử lý khi nhiều máy tính cùng gửi dữ liệu lên mạng cùng lúc.

---

## 1. Các tính năng đã làm được

### 1.1. Yêu cầu cơ bản

- **Tạo và quản lý tài liệu:** Có trang chủ để tạo mới, xem danh sách và xóa các tài liệu cá nhân.
- **Cùng nhau chỉnh sửa:** Nhiều người cùng gõ văn bản chung một file, chữ gõ xong sẽ hiện ngay lên máy người khác.
- **Tránh lỗi mất chữ (Xử lý xung đột):** Dùng thuật toán **Operational Transformation (OT)** để giải quyết tình huống hai người cùng gõ vào một dòng mà không bị đè mất chữ của nhau.
- **Quản lý người dùng:** Hiện danh sách những ai đang mở chung tài liệu.
- **Lưu trữ dữ liệu:** Lưu an toàn toàn bộ nội dung tài liệu và lịch sử gõ phím vào database MySQL.

### 1.2. Tính năng nâng cao

- **Hiện con trỏ chuột của người khác:** Thấy được con trỏ nhấp nháy, vị trí đang gõ và màu sắc riêng của từng người trong phòng.
- **Lưu lại các mốc thời gian (Save History):** Cho phép người dùng bấm lưu các bản nháp quan trọng và có thể xem lại khi cần.
- **Chia sẻ theo quyền:** Chủ tài liệu có thể mời người khác vào xem hoặc cấp quyền cho phép sửa tài liệu.

---

## 2. Mô hình hệ thống & Công nghệ

Dự án sử dụng mô hình **Client-Server**. Nếu chạy hệ thống lớn với nhiều Server, dự án dùng thêm Redis làm trạm trung chuyển để báo cho các Server khác biết có người vừa gõ phím.

### Sơ đồ kiến trúc

```text
┌───────────────────────────────┐
│ Client A / Client B / Client C│
│ React + Tiptap + STOMP client │
└───────────────┬───────────────┘
                │
     HTTP API   │   WebSocket / STOMP
                │
                v
┌───────────────────────────────────────────┐
│ Backend (Spring Boot)                     │
│                                           │
│ - Auth / JWT                              │
│ - Document CRUD                           │
│ - Collaborator management                 │
│ - Session & Presence                      │
│ - Collaboration operation processing      │
│ - Operation history                       │
│ - Outbox publisher                        │
└───────────────┬───────────────────────────┘
                │
      ┌─────────┴─────────┐
      │                   │
      v                   v
┌────────────────┐   ┌──────────────────┐
│ MySQL          │   │ Redis Pub/Sub    │
│                │   │                  │
│ - users        │   │ - accepted ops   │
│ - documents    │   │ - sessions       │
│ - collaborators│   │ - presence       │
│ - operations   │   │ - access revoke  │
│ - outbox       │   └──────────────────┘
└────────────────┘
```

### Sơ đồ mô hình đồng bộ dữ liệu

```text
  NGUOI DUNG
      |
      v
+-------------------------------+
| Go / xoa / sua trong editor   |
+---------------+---------------+
                |
                v
+-------------------------------+
| Frontend tao SubmitOperation  |
| - operationId                 |
| - baseVersion                 |
| - payload                     |
| - clientLamportTime           |
| - vectorClock                 |
+---------------+---------------+
                |
                v
+-------------------------------+
| Gui qua WebSocket / STOMP     |
+---------------+---------------+
                |
                v
+-------------------------------+
| Backend xac thuc JWT          |
| Kiem tra quyen WRITE          |
+---------------+---------------+
                |
                v
+-------------------------------+
| Kiem tra duplicate theo       |
| operationId                   |
+---------------+---------------+
                |
                v
+-------------------------------+
| Khoa ban ghi tai lieu         |
| PESSIMISTIC_WRITE             |
+---------------+---------------+
                |
                v
+-------------------------------+
| Tai cac operation da accepted |
| sau baseVersion               |
+---------------+---------------+
                |
                v
+-------------------------------+
| Transform / rebase thao tac   |
+---------------+---------------+
                |
                v
+-------------------------------+
| Cap nhat content tai lieu     |
| Tang currentVersion           |
+---------------+---------------+
                |
                v
+-------------------------------+
| Luu accepted operation vao DB |
| + serverVersion               |
| + lamportTime                 |
| + vectorClock                 |
+---------------+---------------+
                |
                v
+-------------------------------+
| Ghi outbox event              |
+---------------+---------------+
                |
                v
+-------------------------------+
| Broadcast local               |
| Publish qua Redis             |
+---------------+---------------+
                |
                v
+-------------------------------+
| Cac client khac nhan thay doi |
| va cap nhat giao dien         |
+-------------------------------+
```
### Sơ đồ phân tầng giao thức

```text
+------------------------------------------------------+
|                  TANG NGUOI DUNG                     |
|                                                      |
|                     Nguoi dung                       |
+-------------------------------+----------------------+
                                |
                                v
+------------------------------------------------------+
|                   TANG GIAO DIEN                     |
|                                                      |
|        Frontend (React + Vite + Tiptap)              |
+-------------------------------+----------------------+
                                |
                 +--------------+--------------+
                 |                             |
                 v                             v
+----------------------------------+   +----------------------------------+
| TANG GIAO TIEP CLIENT-SERVER     |   | TANG GIAO TIEP CLIENT-SERVER     |
|                                  |   |                                  |
| HTTP API                         |   | WebSocket / STOMP                |
| - dang nhap                      |   | - sessions.join / leave          |
| - CRUD tai lieu                  |   | - presence.update                |
| - collaborators                  |   | - operations.submit              |
| - operation history              |   | - broadcast realtime             |
+-------------------+--------------+   +-------------------+--------------+
                    |                                  |
                    +------------------+---------------+
                                       |
                                       v
+------------------------------------------------------+
|                TANG XU LY UNG DUNG                   |
|                                                      |
|               Backend (Spring Boot)                  |
|                                                      |
| - Auth / JWT                                         |
| - Document CRUD                                      |
| - Collaboration processing                           |
| - Session / Presence                                 |
| - Operation history                                  |
| - Outbox publisher                                   |
+-------------------------+----------------------------+
                          |
             +------------+-------------+
             |                          |
             v                          v
+------------------------------+   +------------------------------+
| TANG LUU TRU                 |   | TANG PHAT TAN SU KIEN        |
|                              |   |                              |
| MySQL                        |   | Redis Pub/Sub                |
| - users                      |   | - accepted operations        |
| - documents                  |   | - sessions                   |
| - collaborators              |   | - presence                   |
| - document_operations        |   | - access revoked             |
| - collaboration_event_outbox |   |                              |
+------------------------------+   +------------------------------+
```
---

## 3. Các API và luồng kết nối chính

Dự án dùng song song 2 đường truyền:

### 3.1. Đường HTTP (REST API)

Dùng cho các chức năng tải trang tĩnh, chỉ cần làm một lần. (Bắt buộc phải có thẻ JWT để chứng minh đã đăng nhập).

* `POST /api/auth/register` & `/api/auth/login` : Đăng ký, đăng nhập.
* `GET /api/documents` : Lấy danh sách tài liệu ra màn hình chính.
* `POST /api/documents` : Tạo file tài liệu mới.
* `GET /api/documents/{id}/collaborators` : Xem danh sách những người được chia sẻ quyền.
* `POST /api/images/upload` : Tải ảnh lên khi dán vào văn bản.

### 3.2. Giao thức WebSocket (STOMP)

Đảm nhiệm luồng truyền tải dữ liệu cộng tác theo thời gian thực (Real-time Collaboration) với độ trễ thấp nhất.

* **Khởi tạo phiên làm việc :** Client gửi yêu cầu kết nối tới `/app/documents/{id}/sessions.join` để thông báo tham gia vào phiên chỉnh sửa.
* **Đồng bộ thao tác chỉnh sửa (Submit Operation):** Các sự kiện thay đổi văn bản (nhập/xóa) được đẩy lên kênh `/app/documents/{id}/operations.submit`.
* **Cập nhật trạng thái hiện diện (Presence Update):** Đồng bộ trạng thái hiện diện của người dùng như vị trí con trỏ, trạng thái làm việc và các sự kiện presence khác của người dùng qua kênh `/app/documents/{id}/presence.update`.
* **Lắng nghe sự kiện (Subscribe/Broadcast):** Mọi Client trong phiên làm việc sẽ subscribe kênh `/topic/documents/{id}/operations` để nhận bản tin cập nhật thao tác từ người dùng khác ngay lập tức.

---

## 4. Hướng dẫn chạy dự án

### Cần cài đặt trên máy

* Node.js (bản 18 trở lên)
* Java (JDK 23)
* Hệ quản trị cơ sở dữ liệu MySQL (chạy cổng 3306)
* Redis (chạy cổng 6379)
* *(Lưu ý: Nếu máy có cài sẵn Docker, có thể bỏ qua bước cài MySQL và Redis ở trên)*

### Chạy dự án bằng Docker Compose

Mở cửa sổ lệnh (Terminal) tại thư mục `BTL_HTPT` và gõ:

```powershell
docker compose up -d --build
```

* **Trang web Frontend:** Vào `http://localhost:13000`
* **Backend API (ngầm):** `http://localhost:18080`

**Tài khoản dùng thử (đã tạo sẵn):**

- Tài khoản: Hale
- Mật khẩu: 123456
