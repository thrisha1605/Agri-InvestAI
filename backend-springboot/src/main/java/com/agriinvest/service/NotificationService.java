package com.agriinvest.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.agriinvest.model.User;
import com.agriinvest.model.UserNotification;
import com.agriinvest.repository.UserNotificationRepository;
import com.agriinvest.repository.UserRepository;

import jakarta.validation.ValidationException;

@Service
public class NotificationService {

    public record NotificationDraft(
            String userId,
            String type,
            String title,
            String message,
            String actionUrl,
            Map<String, Object> metadata
    ) {
    }

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public NotificationService(UserNotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<UserNotification> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    public UserNotification notifyUser(NotificationDraft draft) {
        if (draft == null || isBlank(draft.userId())) {
            throw new ValidationException("Notification user is required");
        }

        UserNotification notification = new UserNotification();
        notification.setUserId(draft.userId().trim());
        notification.setType(defaultString(draft.type(), "SYSTEM_ALERT"));
        notification.setTitle(defaultString(draft.title(), "Notification"));
        notification.setMessage(defaultString(draft.message(), ""));
        notification.setTimestamp(Instant.now());
        notification.setRead(false);
        notification.setActionUrl(trimToNull(draft.actionUrl()));
        notification.setMetadata(draft.metadata());

        UserNotification saved = notificationRepository.save(notification);
        pushEvent(saved.getUserId(), "notification", saved);
        return saved;
    }

    public List<UserNotification> notifyUsers(Collection<String> userIds,
                                              String type,
                                              String title,
                                              String message,
                                              String actionUrl,
                                              Map<String, Object> metadata) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }

        List<UserNotification> sent = new ArrayList<>();
        userIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .forEach(userId -> sent.add(notifyUser(new NotificationDraft(
                        userId,
                        type,
                        title,
                        message,
                        actionUrl,
                        metadata
                ))));
        return sent;
    }

    public List<UserNotification> notifyRole(String role,
                                             String type,
                                             String title,
                                             String message,
                                             String actionUrl,
                                             Map<String, Object> metadata) {
        if (isBlank(role)) {
            return List.of();
        }

        List<String> userIds = userRepository.findByRoleIgnoreCase(role.trim()).stream()
                .map(User::getId)
                .filter(Objects::nonNull)
                .toList();

        return notifyUsers(userIds, type, title, message, actionUrl, metadata);
    }

    public void markAsRead(String userId, String notificationId) {
        notificationRepository.findByIdAndUserId(notificationId, userId).ifPresent(notification -> {
            if (!notification.isRead()) {
                notification.setRead(true);
                UserNotification saved = notificationRepository.save(notification);
                pushEvent(userId, "notification-read", saved);
            }
        });
    }

    public void markAllAsRead(String userId) {
        List<UserNotification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(userId);
        List<UserNotification> updated = notifications.stream()
                .filter(notification -> !notification.isRead())
                .peek(notification -> notification.setRead(true))
                .toList();

        if (updated.isEmpty()) {
            return;
        }

        notificationRepository.saveAll(updated);
        pushEvent(userId, "notifications-read-all", Map.of("count", updated.size()));
    }

    public void delete(String userId, String notificationId) {
        notificationRepository.findByIdAndUserId(notificationId, userId).ifPresent(notification -> {
            notificationRepository.delete(notification);
            pushEvent(userId, "notification-deleted", Map.of("id", notificationId));
        });
    }

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(ignored -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "live")));
        } catch (Exception exception) {
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void pushEvent(String userId, String eventName, Object payload) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }

        List<SseEmitter> staleEmitters = new ArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload));
            } catch (Exception exception) {
                staleEmitters.add(emitter);
            }
        }

        staleEmitters.forEach(emitter -> removeEmitter(userId, emitter));
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }

        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String defaultString(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }
}
