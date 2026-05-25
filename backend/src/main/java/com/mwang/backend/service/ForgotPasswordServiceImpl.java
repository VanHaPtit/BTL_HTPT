package com.mwang.backend.service;

import com.mwang.backend.domain.User;
import com.mwang.backend.repositories.UserRepository;
import com.mwang.backend.domain.model.EmailRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ForgotPasswordServiceImpl implements ForgotPasswordService {

    private final UserRepository userRepository;
    private final SendGridMailService sendGridMailService;
    private final PasswordEncoder passwordEncoder;

    public ForgotPasswordServiceImpl(UserRepository userRepository,
                                     SendGridMailService sendGridMailService,
                                     PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sendGridMailService = sendGridMailService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void processForgotPassword(String emailOrUsername) {
        String cleanEmail = emailOrUsername != null ? emailOrUsername.trim() : "";
        User user = userRepository.findByEmail(cleanEmail)
                .orElseGet(() -> userRepository.findByUsername(cleanEmail)
                        .orElseThrow(() -> new RuntimeException("Email/Username không tồn tại trong hệ thống: " + cleanEmail)));

        String newPassword = UUID.randomUUID().toString().substring(0, 8);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setToEmail(user.getEmail());
        emailRequest.setSubject("Khôi phục mật khẩu");
        emailRequest.setContent("Chào bạn,\n\nMật khẩu mới của bạn là: " + newPassword +
                "\nVui lòng đăng nhập và đổi lại mật khẩu ngay để bảo mật.");

        try {
            sendGridMailService.sendMail(emailRequest);
        } catch (Exception e) {
            System.err.println("Không thể gửi email: " + e.getMessage());
        }
    }
}
