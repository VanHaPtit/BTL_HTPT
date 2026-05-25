package com.mwang.backend.web.controller;

import com.mwang.backend.service.ForgotPasswordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(ForgotPasswordService forgotPasswordService) {
        this.forgotPasswordService = forgotPasswordService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam("email") String email) {
        try {
            forgotPasswordService.processForgotPassword(email);
            return ResponseEntity.ok("Mật khẩu mới đã được gửi đến email của bạn.");
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("không tồn tại")) {
                return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
            }
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi máy chủ: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Lỗi không xác định: " + e.getMessage());
        }
    }
}
