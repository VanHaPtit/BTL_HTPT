package com.mwang.backend.web.controller;

import com.mwang.backend.domain.User;
import com.mwang.backend.repositories.UserRepository;
import com.mwang.backend.service.CurrentUserProvider;
import com.mwang.backend.web.model.UserProfileResponse;
import com.mwang.backend.web.model.UserSummaryResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, CurrentUserProvider currentUserProvider, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
        this.passwordEncoder = passwordEncoder;
    }

    public static class ChangePasswordRequest {
        public String oldPassword;
        public String newPassword;
    }

    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(HttpServletRequest request, @RequestBody ChangePasswordRequest req) {
        User user = currentUserProvider.requireCurrentUser(request);
        if (!passwordEncoder.matches(req.oldPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body("Mật khẩu cũ không chính xác.");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Đổi mật khẩu thành công.");
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(HttpServletRequest request) {
        User user = currentUserProvider.requireCurrentUser(request);
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getStatus()
        );
    }

    @GetMapping("/search")
    public List<UserSummaryResponse> search(@RequestParam(required = false) String q) {
        if (q == null || q.isBlank() || q.length() < 2) return List.of();
        return userRepository.searchByUsernameOrEmail(q, PageRequest.of(0, 10))
                .stream()
                .map(u -> new UserSummaryResponse(u.getId(), u.getUsername()))
                .toList();
    }
}
