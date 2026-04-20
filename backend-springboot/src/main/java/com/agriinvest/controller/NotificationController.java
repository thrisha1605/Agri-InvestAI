package com.agriinvest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.agriinvest.model.UserNotification;
import com.agriinvest.security.AuthTokenService;
import com.agriinvest.service.NotificationService;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthTokenService authTokenService;

    public NotificationController(NotificationService notificationService,
                                  AuthTokenService authTokenService) {
        this.notificationService = notificationService;
        this.authTokenService = authTokenService;
    }

    @GetMapping
    public List<UserNotification> list(@RequestAttribute("authenticatedUserId") String userId) {
        return notificationService.getNotifications(userId);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestAttribute(value = "authenticatedUserId", required = false) String authenticatedUserId,
                             @RequestHeader(value = "Authorization", required = false) String authorization,
                             @RequestParam(required = false) String token) {
        return notificationService.subscribe(resolveUserId(authenticatedUserId, authorization, token));
    }

    @PutMapping("/{notificationId}/read")
    public Map<String, String> markAsRead(@RequestAttribute("authenticatedUserId") String userId,
                                          @PathVariable String notificationId) {
        notificationService.markAsRead(userId, notificationId);
        return Map.of("message", "Notification marked as read");
    }

    @PutMapping("/read-all")
    public Map<String, String> markAllAsRead(@RequestAttribute("authenticatedUserId") String userId) {
        notificationService.markAllAsRead(userId);
        return Map.of("message", "All notifications marked as read");
    }

    @DeleteMapping("/{notificationId}")
    public Map<String, String> delete(@RequestAttribute("authenticatedUserId") String userId,
                                      @PathVariable String notificationId) {
        notificationService.delete(userId, notificationId);
        return Map.of("message", "Notification deleted");
    }

    private String resolveUserId(String authenticatedUserId, String authorization, String token) {
        if (authenticatedUserId != null && !authenticatedUserId.isBlank()) {
            return authenticatedUserId;
        }

        if (token != null && !token.isBlank()) {
            return authTokenService.getUserId(token.trim())
                    .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid notification token"));
        }

        if (authorization != null && authorization.startsWith("Bearer ")) {
            String bearerToken = authorization.substring("Bearer ".length()).trim();
            return authTokenService.getUserId(bearerToken)
                    .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid notification token"));
        }

        throw new ResponseStatusException(UNAUTHORIZED, "Authentication is required");
    }
}
