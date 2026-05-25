# Máy chủ xử lý (Backend)

Đây là thư mục chứa logic của hệ thống (Backend) đảm nhận nhiệm vụ cực kỳ quan trọng là tiếp nhận kết nối, bảo mật, xử lý đồng bộ chữ khi nhiều người cùng gõ, và ghi lưu dữ liệu vĩnh viễn vào Database.

---

## 1. Công nghệ sử dụng

* **Java 17/23 và Spring Boot 3:** Bộ khung chính để xây dựng hệ thống máy chủ mạnh mẽ.
* **Spring Security (JWT):** Bảo vệ API, đảm bảo chỉ người có thẻ Token hợp lệ mới được lấy dữ liệu.
* **Spring WebSocket:** Mở đường truyền siêu tốc (Real-time) để nhận phím gõ của mọi người.
* **Spring Data JPA và Flyway:** Tương tác với CSDL MySQL và tự động tạo bảng dữ liệu.
* **Redis:** Trạm trung chuyển thông báo tốc độ cao (đảm bảo đồng bộ được ngay cả khi hệ thống chạy nhiều máy chủ).

---

## 2. Các nhiệm vụ chính của Backend

* **Điều phối luồng HTTP:** Xử lý việc đăng nhập, tạo mới tài liệu, cấp quyền chia sẻ.
* **Phân giải xung đột thuật toán OT (Operational Transformation):** Chìa khóa của hệ thống phân tán! Khi 2 người cùng gõ 1 lúc, Backend sẽ tạm khóa tài liệu, áp dụng thuật toán toán học để gộp chữ lại cho đúng thứ tự rồi báo về cho mọi người.
* **Quản lý phòng (Session):** Theo dõi xem ai đang vào phòng, ai vừa thoát ra để báo cho các máy khác biết.
* **Lưu trữ an toàn:** Lưu toàn bộ chữ viết, mốc lịch sử (Save History) vào MySQL.

---

## 3. Cấu trúc thư mục chính

Các file code nằm tại `src/main/java/com/mwang/backend/`:

* `/web/controller` : Đón nhận request từ Frontend gõ vào (API & WebSocket).
* `/service` : Nơi chứa toàn bộ thuật toán xử lý logic (ví dụ kiểm tra quyền, tạo bản lưu...).
* `/collaboration` : Cụm logic khó nhất, chuyên xử lý thuật toán gộp chữ OT.
* `/domain` & `/repositories` : Định nghĩa các bảng dữ liệu MySQL (Tài liệu, User...) và các hàm gọi tới Database.
* `/config` : Cài đặt cấu hình mạng, bảo mật, và đường dẫn kết nối.

---

## 4. Hướng dẫn chạy Backend 

Để chạy được Backend, bạn cần cài đặt **Java (JDK)**, **MySQL** và **Redis**.
Đảm bảo bạn đã mở MySQL tạo sẵn một database trống tên là `collaborative_doc`.

**Bước 1:** Kiểm tra thông tin đăng nhập Database tại file `src/main/resources/application.properties` (sửa lại User/Pass cho khớp với máy bạn).

**Bước 2:** Mở Terminal tại thư mục `backend` này và gõ lệnh chạy:

```powershell
./mvnw.cmd spring-boot:run
```
