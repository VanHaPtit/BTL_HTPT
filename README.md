# BTL_HTPT - Hệ thống soạn thảo văn bản cộng tác thời gian thực

BTL_HTPT là project xây dựng một hệ thống soạn thảo văn bản cộng tác, trong đó nhiều người dùng có thể cùng mở, cùng chỉnh sửa và theo dõi thay đổi của nhau gần thời gian thực trên cùng một tài liệu.

Project được xây dựng theo hướng client-server, kết hợp giao tiếp HTTP API cho các chức năng nghiệp vụ và WebSocket/STOMP cho luồng collaboration realtime. Backend đóng vai trò điều phối thao tác, quản lý quyền truy cập, lưu trạng thái bền vững của tài liệu và đồng bộ thay đổi tới các client khác.

## 1. Mục tiêu của project

Mục tiêu của hệ thống:

- cho phép người dùng tạo, mở và quản lý tài liệu văn bản
- hỗ trợ nhiều người cùng chỉnh sửa một tài liệu theo thời gian thực
- đảm bảo đồng bộ và tính nhất quán của tài liệu khi có nhiều thao tác đồng thời
- hiển thị những người đang tham gia phiên chỉnh sửa
- lưu trữ tài liệu và lịch sử thao tác trên server
- thể hiện rõ các yếu tố của hệ thống phân tán trong quá trình đồng bộ dữ liệu

## 2. Chức năng chính

### 2.1. Quản lý tài liệu

- Đăng ký, đăng nhập bằng tài khoản người dùng
- Tạo tài liệu mới
- Xem danh sách tài liệu
- Mở và đọc nội dung tài liệu
- Chỉnh sửa tiêu đề, nội dung, visibility
- Xóa tài liệu

### 2.2. Cộng tác thời gian thực

- Nhiều người dùng có thể mở cùng một tài liệu
- Thao tác chỉnh sửa được gửi lên server qua WebSocket/STOMP
- Server chấp nhận thao tác, cấp `serverVersion`, lưu vào operation log
- Các client khác nhận thay đổi gần thời gian thực

### 2.3. Quản lý phiên chỉnh sửa

- Hiển thị danh sách người đang tham gia tài liệu
- Theo dõi session đang kết nối
- Hiển thị con trỏ của các client khác trong editor

### 2.4. Phân quyền tài liệu

Project hiện có các mức quyền:

- `OWNER`
- `WRITE`
- `READ`

Người dùng có thể chia sẻ tài liệu và quản lý collaborator theo quyền truy cập.

### 2.5. Lưu trữ và theo dõi lịch sử

- Tài liệu được lưu bền vững trong MySQL
- Mỗi accepted operation được lưu vào `document_operations`
- Hệ thống có versioning và operation history
- Có checkpoint định kỳ để hỗ trợ catch-up và khôi phục trạng thái

## 3. Đối chiếu với yêu cầu đề bài

### 3.1. Yêu cầu chức năng bắt buộc

- Tạo và quản lý tài liệu: Đã có
- Chỉnh sửa cộng tác theo thời gian thực: Đã có
- Đồng bộ thay đổi: Đã có
- Quản lý người dùng đang chỉnh sửa: Đã có
- Hiển thị vị trí con trỏ: Đã có
- Lưu trữ tài liệu trên server: Đã có

### 3.2. Yêu cầu kỹ thuật bắt buộc

- Giao tiếp mạng giữa client và server: Đã có, gồm HTTP API và WebSocket/STOMP
- Xử lý nhiều client đồng thời: Đã có
- Cơ chế đồng bộ thay đổi giữa các client: Đã có
- Xử lý xung đột chỉnh sửa đồng thời: Đã có

### 3.3. Chức năng nâng cao hiện có

- Lịch sử chỉnh sửa và versioning: Đã có
- Hiển thị con trỏ của người dùng khác: Đã có
- Offline editing và đồng bộ lại khi reconnect: Đã có ở mức cơ bản
- Phân quyền người dùng: Đã có
- Undo/redo trong môi trường cộng tác: Chưa có
- Hiển thị vùng chọn của người dùng khác: Chưa có

## 4. Quy trình hoạt động

### 4.1. Quy trình đăng nhập và sử dụng

1. Người dùng đăng ký hoặc đăng nhập.
2. Frontend nhận JWT từ backend.
3. Người dùng vào dashboard, xem danh sách tài liệu.
4. Người dùng mở một tài liệu để bắt đầu phiên chỉnh sửa.

### 4.2. Quy trình mở tài liệu để cộng tác

1. Frontend gọi `GET /api/documents/{id}` để lấy nội dung hiện tại.
2. Frontend mở kết nối WebSocket tới backend.
3. Client gửi message join session.
4. Backend xác thực người dùng, kiểm tra quyền đọc, sau đó lưu session.
5. Backend broadcast session snapshot để các client khác cập nhật danh sách thành viên.

### 4.3. Quy trình chỉnh sửa realtime

1. Người dùng thao tác trong editor.
2. Frontend chuyển thao tác editor thành `SubmitOperationRequest`.
3. Request được gửi qua STOMP đến backend.
4. Backend:
   - xác thực người dùng
   - kiểm tra quyền `WRITE`
   - kiểm tra duplicate bằng `operationId`
   - khóa bản ghi tài liệu để xử lý đồng thời
   - transform thao tác mới dựa trên các thao tác đã accepted
   - cập nhật nội dung tài liệu và tăng `serverVersion`
   - lưu accepted operation vào operation log
5. Sau khi transaction commit:
   - backend broadcast accepted operation đến client cùng node
   - event được đưa vào outbox
   - outbox publisher đẩy sự kiện qua Redis để các backend instance khác tiếp tục broadcast

### 4.4. Quy trình reconnect

1. Khi client mất kết nối, frontend giữ trạng thái và có thể xếp thao tác vào offline queue.
2. Khi kết nối lại, client gửi thông tin `X-Last-Server-Version-*`.
3. Backend thực hiện catch-up các thao tác còn thiếu.
4. Frontend replay các thao tác offline đã queue.

## 5. Kiến trúc hệ thống

### 5.1. Tổng quan kiến trúc

Hệ thống gồm 4 thành phần chính:

- Frontend: giao diện người dùng và editor
- Backend: xử lý nghiệp vụ, bảo mật, collaboration, persistence
- MySQL: lưu dữ liệu bền vững
- Redis: đồng bộ sự kiện collaboration giữa các backend instance

Mô hình tổng quát:

```text
Client (React + Tiptap)
        |
        | HTTP / WebSocket(STOMP)
        v
Backend (Spring Boot)
        |
        +--> MySQL
        |
        +--> Redis Pub/Sub
```

### 5.2. Frontend

Frontend được xây dựng bằng:

- React
- TypeScript
- Vite
- Tiptap editor

Frontend đảm nhiệm:

- đăng nhập, đăng ký
- dashboard tài liệu
- trang editor
- mở WebSocket
- gửi thao tác collaboration
- hiển thị danh sách session, operation history, remote cursor

### 5.3. Backend

Backend được xây dựng bằng:

- Spring Boot 3.5
- Spring Web
- Spring Security
- Spring WebSocket
- Spring Data JPA
- Flyway
- Redis

Backend đảm nhiệm:

- xác thực JWT
- CRUD tài liệu
- quản lý collaborator
- xử lý accepted operation
- đồng bộ session/presence
- fanout sự kiện collaboration
- metrics và health monitoring

### 5.4. Cơ sở dữ liệu

MySQL được dùng để lưu:

- thông tin người dùng
- tài liệu
- collaborator và quyền trực cập
- lịch sử thao tác
- outbox event
- checkpoint tài liệu

Redis được dùng để:

- fanout accepted operation giữa các instance backend
- broadcast session snapshot
- broadcast presence update
- broadcast access revoked event
- lưu session collaboration đang hoạt động

## 6. Mô hình đồng bộ dữ liệu

Project hiện áp dụng mô hình `server-authoritative`.

Điều này có nghĩa:

- client không tự quyết định phiên bản đúng cuối cùng
- mọi thao tác phải đi qua backend
- backend sắp xếp, transform và chấp nhận thao tác
- backend mới là nơi sinh ra `serverVersion`

Hệ thống hiện đang dùng các cơ chế sau:

- Pessimistic locking để tuần tự hóa ghi nhận thao tác
- Idempotency theo operationId
- Operational transform / rebase
- currentVersion trên tài liệu
- serverVersion trên từng operation
- Lamport time và vector clock ở mức metadata
- outbox để đảm bảo publish accepted operation sau commit

## 7. Giao thức trao đổi dữ liệu

### 7.1. HTTP API

Dùng cho:

- đăng ký, đăng nhập
- CRUD tài liệu
- quản lý collaborator
- lấy operation history
- lấy checkpoint mới nhất

Một số endpoint chính:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/{id}`
- `PUT /api/documents/{id}`
- `DELETE /api/documents/{id}`
- `GET /api/documents/{id}/operations`
- `GET /api/documents/{id}/checkpoints/latest`

### 7.2. WebSocket/STOMP

Dùng cho collaboration realtime.

Client gửi lên:

- `/app/documents/{documentId}/sessions.join`
- `/app/documents/{documentId}/sessions.leave`
- `/app/documents/{documentId}/presence.update`
- `/app/documents/{documentId}/operations.submit`

Client subscribe:

- `/topic/documents/{documentId}/sessions`
- `/topic/documents/{documentId}/presence`
- `/topic/documents/{documentId}/operations`
- `/topic/documents/{documentId}/access/{userId}`
- `/user/queue/catchup.{documentId}`

## 8. Cơ chế xử lý xung đột chỉnh sửa đồng thời

Để đảm bảo tính nhất quán khi nhiều người cùng sửa:

- mọi thao tác đều có `baseVersion`
- backend tải các thao tác đã accepted sau `baseVersion`
- thao tác mới được transform lần lượt theo thứ tự accepted
- nếu thao tác trở thành vô nghĩa sau transform thì có thể thành `NO_OP`
- kết quả cuối cùng được lưu vào tài liệu và operation log

Đây là phần cốt lõi giúp project đáp ứng yêu cầu "đồng bộ thay đổi" và "xử lý xung đột chỉnh sửa đồng thời".

## 9. Kiểm thử và trạng thái hiện tại

Trạng thái đã kiểm tra:

- frontend build thành công
- backend test suite đã chạy pass ở mức unit/slice test
- hệ thống có thể chạy qua Docker Compose
- login, mở tài liệu, collaboration, session và remote cursor đã được rà soát trong quá trình hoàn thiện

Giới hạn hiện tại:

- undo/redo cộng tác chưa có
- vùng chọn remote chưa có đầy đủ
- offline editing mới ở mức cơ bản
- một số test integration dùng Testcontainers phụ thuộc môi trường Docker

## 10. Hướng dẫn chạy nhanh

### 10.1. Chạy bằng Docker Compose

Tại thư mục `BTL_HTPT`:

```powershell
docker compose up -d --build
```

Địa chỉ mặc định:

- Frontend: `http://localhost:13000`
- Backend: `http://localhost:18080`
- Health check: `http://localhost:18080/actuator/health`
- MySQL: `localhost:33306`
- Redis: `localhost:16379`

### 10.2. Tài khoản demo

Project profile `dev` có seed dữ liệu demo. Một tài khoản mẫu:

- username: `alice`
- password: `demo1234`

### 10.3. Chạy riêng từng thành phần

Frontend:

```powershell
npm install
npm run dev
```

Backend:

```powershell
./mvnw.cmd spring-boot:run
```

Lưu ý:

- backend cần MySQL và Redis
- backend hiện cấu hình Java 23

## 11. Công nghệ sử dụng

Frontend:

- React
- TypeScript
- Vite
- Tiptap
- Axios
- STOMP client

Backend:

- Spring Boot 3.5
- Spring Web
- Spring Security
- Spring WebSocket
- Spring Data JPA
- Flyway
- MySQL
- Redis
- Micrometer / Actuator

DevOps và test:

- Docker Compose
- Maven
- JUnit
- Testcontainers

## 12. Kết luận

BTL_HTPT là một hệ thống soạn thảo văn bản cộng tác thời gian thực đã triển khai được các thành phần quan trọng của một ứng dụng phân tán:

- giao tiếp HTTP và WebSocket giữa client-server
- xử lý nhiều client đồng thời
- đồng bộ thay đổi gần thời gian thực
- xử lý xung đột chỉnh sửa đồng thời
- lưu trữ tài liệu và operation history trên server
- quản lý session, presence và remote cursor
- phân quyền người dùng theo tài liệu

Project đáp ứng được các yêu cầu chính của đề bài, đồng thời đã có thêm một số chức năng nâng cao như versioning, remote cursor, offline replay cơ bản và chia sẻ tài liệu theo quyền truy cập.
