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

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public UserController(UserRepository userRepository, CurrentUserProvider currentUserProvider) {
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
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
