package com.agriinvest.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.agriinvest.dto.AiChatRequest;
import com.agriinvest.model.AiChatRecord;
import com.agriinvest.repository.AiChatRecordRepository;

@Service
public class AiChatHistoryService {

    private final AiChatRecordRepository aiChatRecordRepository;

    public AiChatHistoryService(AiChatRecordRepository aiChatRecordRepository) {
        this.aiChatRecordRepository = aiChatRecordRepository;
    }

    public void saveTurn(String userId,
                         String role,
                         String userName,
                         AiChatRequest request,
                         String reply,
                         String provider) {
        AiChatRecord record = new AiChatRecord();
        record.setId(UUID.randomUUID().toString());
        record.setUserId(normalizeUserId(userId));
        record.setUserName(safeText(userName));
        record.setRole(normalizeRole(role));
        record.setMessage(request == null ? "" : safeText(request.getMessage()));
        record.setReply(safeText(reply));
        record.setImage(request == null ? "" : safeText(request.getImage()));
        record.setProvider(safeText(provider));
        record.setCreatedAt(Instant.now());
        aiChatRecordRepository.save(record);
    }

    public List<Map<String, Object>> getHistory(String userId, String role) {
        List<AiChatRecord> records = aiChatRecordRepository.findByUserIdAndRoleOrderByCreatedAtAsc(
                normalizeUserId(userId),
                normalizeRole(role)
        );

        List<Map<String, Object>> history = new ArrayList<>();
        for (AiChatRecord record : records) {
            history.add(toUserMessage(record));
            history.add(toAssistantMessage(record));
        }
        return history;
    }

    public void clearHistory(String userId, String role) {
        aiChatRecordRepository.deleteByUserIdAndRole(normalizeUserId(userId), normalizeRole(role));
    }

    private Map<String, Object> toUserMessage(AiChatRecord record) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("sender", "user");
        message.put("text", safeText(record.getMessage()));
        message.put("image", safeText(record.getImage()));
        message.put("timestamp", record.getCreatedAt());
        return message;
    }

    private Map<String, Object> toAssistantMessage(AiChatRecord record) {
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("sender", "ai");
        message.put("text", safeText(record.getReply()));
        message.put("image", "");
        message.put("timestamp", record.getCreatedAt());
        message.put("provider", safeText(record.getProvider()));
        return message;
    }

    private String normalizeUserId(String userId) {
        String normalized = safeText(userId);
        return normalized.isBlank() ? "guest" : normalized;
    }

    private String normalizeRole(String role) {
        String normalized = safeText(role).toUpperCase(Locale.ROOT);
        return normalized.isBlank() ? "FARMER" : normalized;
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }
}
