// package com.mwang.backend.web.controller;
// 
// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.mwang.backend.config.TestSecurityConfig;
// import com.mwang.backend.domain.DocumentOperationType;
// import com.mwang.backend.domain.User;
// import com.mwang.backend.service.OperationHistoryService;
// import com.mwang.backend.service.exception.DocumentAccessDeniedException;
// import com.mwang.backend.service.exception.DocumentNotFoundException;
// import com.mwang.backend.web.model.AcceptedOperationResponse;
// import com.mwang.backend.web.model.OperationPageResponse;
// import io.github.resilience4j.ratelimiter.RequestNotPermitted;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
// import org.springframework.context.annotation.Import;
// import org.springframework.security.test.context.support.WithMockUser;
// import org.springframework.test.context.bean.override.mockito.MockitoBean;
// import org.springframework.test.web.servlet.MockMvc;
// 
// import java.time.Instant;
// import java.util.List;
// import java.util.UUID;
// 
// import static org.mockito.ArgumentMatchers.*;
// import static org.mockito.Mockito.*;
// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
// 
// @WebMvcTest(OperationHistoryController.class)
// @Import({RestExceptionHandler.class, TestSecurityConfig.class})
// class OperationHistoryControllerTest {
// 
//     @Autowired MockMvc mockMvc;
//     @Autowired ObjectMapper objectMapper;
//     @MockitoBean OperationHistoryService operationHistoryService;
// 
//     @Test
//     @WithMockUser
//     void returnsOpsPage() throws Exception {
//         UUID documentId = UUID.randomUUID();
//         UUID operationId = UUID.randomUUID();
//         AcceptedOperationResponse op = new AcceptedOperationResponse(
//                 operationId, documentId, 3L, DocumentOperationType.INSERT_TEXT,
//                 objectMapper.readTree("{\"path\":[0],\"offset\":0,\"text\":\"hi\"}"),
//                 UUID.randomUUID(), "sess", Instant.now(), 0L, java.util.Map.of());
//         OperationPageResponse page = new OperationPageResponse(documentId, 2L, List.of(op), false);
// 
//         when(operationHistoryService.getOperationPage(eq(documentId), eq(2L), eq(100), nullable(User.class)))
//                 .thenReturn(page);
// 
//     }
// 
//     @Test
//     @WithMockUser
//     void returns429WhenRateLimitExceeded() throws Exception {
//         UUID documentId = UUID.randomUUID();
//         when(operationHistoryService.getOperationPage(any(), anyLong(), anyInt(), nullable(User.class)))
//                 .thenThrow(RequestNotPermitted.createRequestNotPermitted(
//                         io.github.resilience4j.ratelimiter.RateLimiter.of("test",
//                                 io.github.resilience4j.ratelimiter.RateLimiterConfig.ofDefaults())));
// 
//         mockMvc.perform(get("/api/documents/{id}/operations", documentId)
//                         .param("sinceVersion", "0"))
//                 .andExpect(status().isTooManyRequests())
//                 .andExpect(jsonPath("$.code").value("RATE_LIMIT_EXCEEDED"));
//     }
// }
