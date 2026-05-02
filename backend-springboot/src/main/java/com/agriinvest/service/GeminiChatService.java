package com.agriinvest.service;

import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.agriinvest.dto.AiChatRequest;

@Service
public class GeminiChatService {

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";

    private final RestTemplate restTemplate;
    private final AiIntegrationService aiIntegrationService;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    public GeminiChatService(RestTemplate restTemplate, AiIntegrationService aiIntegrationService) {
        this.restTemplate = restTemplate;
        this.aiIntegrationService = aiIntegrationService;
    }

    public Optional<String> generateReply(AiChatRequest request) {
        return generateResponse(request).map(GeneratedReply::text);
    }

    public Optional<GeneratedReply> generateResponse(AiChatRequest request) {
        Optional<String> flaskReply = aiIntegrationService.generateChatReply(request);
        if (flaskReply.isPresent()) {
            return flaskReply.map(reply -> new GeneratedReply(reply, "flask-gemini"));
        }

        if (!isConfigured() || request == null) {
            return Optional.empty();
        }

        String message = safeText(request.getMessage());
        if (message.isBlank() && !hasImage(request)) {
            return Optional.empty();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey.trim());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(buildPayload(request), headers);
            String endpoint = GEMINI_API_URL.formatted(normalizeModel(model));

            Map<?, ?> response = restTemplate.postForObject(endpoint, entity, Map.class);
            return extractReplyText(response)
                    .filter(text -> !text.isBlank())
                    .map(reply -> new GeneratedReply(reply, "gemini-direct"));
        } catch (Exception exception) {
            System.err.println("Gemini chat fallback: " + exception.getMessage());
            return Optional.empty();
        }
    }

    private Map<String, Object> buildPayload(AiChatRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", buildSystemInstruction(request)))
        ));
        payload.put("contents", buildContents(request));
        payload.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 700
        ));
        return payload;
    }

    private List<Map<String, Object>> buildContents(AiChatRequest request) {
        List<Map<String, Object>> contents = new ArrayList<>();

        List<AiChatRequest.AiChatTurn> history = request.getHistory() == null ? List.of() : request.getHistory();
        int startIndex = Math.max(0, history.size() - 10);
        for (int index = startIndex; index < history.size(); index += 1) {
            AiChatRequest.AiChatTurn turn = history.get(index);
            String text = safeText(turn == null ? null : turn.getText());
            if (text.isBlank()) {
                continue;
            }

            contents.add(Map.of(
                    "role", "ai".equalsIgnoreCase(turn.getSender()) ? "model" : "user",
                    "parts", List.of(Map.of("text", text))
            ));
        }

        contents.add(Map.of(
                "role", "user",
                "parts", buildCurrentUserParts(request)
        ));

        return contents;
    }

    private List<Map<String, Object>> buildCurrentUserParts(AiChatRequest request) {
        List<Map<String, Object>> parts = new ArrayList<>();

        String message = safeText(request.getMessage());
        if (message.isBlank() && hasImage(request)) {
            message = "Analyze this image and answer the user's question clearly and practically.";
        }

        if (!message.isBlank()) {
            parts.add(Map.of("text", message));
        }

        imagePart(request.getImage()).ifPresent(parts::add);
        return parts;
    }

    private Optional<Map<String, Object>> imagePart(String imageData) {
        String rawImage = safeText(imageData);
        if (rawImage.isBlank() || !rawImage.contains(",")) {
            return Optional.empty();
        }

        String[] parts = rawImage.split(",", 2);
        String metadata = parts[0];
        String base64Data = safeText(parts[1]);
        if (base64Data.isBlank()) {
            return Optional.empty();
        }

        try {
            Base64.getDecoder().decode(base64Data);
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }

        return Optional.of(Map.of(
                "inlineData", Map.of(
                        "mimeType", extractMimeType(metadata),
                        "data", base64Data
                )
        ));
    }

    private Optional<String> extractReplyText(Map<?, ?> response) {
        if (response == null) {
            return Optional.empty();
        }

        Object candidatesValue = response.get("candidates");
        if (!(candidatesValue instanceof List<?> candidates) || candidates.isEmpty()) {
            return Optional.empty();
        }

        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidateMap)) {
            return Optional.empty();
        }

        Object contentValue = candidateMap.get("content");
        if (!(contentValue instanceof Map<?, ?> contentMap)) {
            return Optional.empty();
        }

        Object partsValue = contentMap.get("parts");
        if (!(partsValue instanceof List<?> parts) || parts.isEmpty()) {
            return Optional.empty();
        }

        StringBuilder reply = new StringBuilder();
        for (Object part : parts) {
            if (part instanceof Map<?, ?> partMap) {
                Object textValue = partMap.get("text");
                if (textValue != null) {
                    reply.append(String.valueOf(textValue));
                }
            }
        }

        return Optional.of(reply.toString().trim());
    }

    private String buildSystemInstruction(AiChatRequest request) {
        List<String> lines = new ArrayList<>();
        lines.add("You are Agri-Invest AI, a warm real-time assistant inside an Indian agriculture platform.");
        lines.add("Answer naturally like a helpful chatbot, not like a robotic FAQ.");
        lines.add("Keep replies practical, clear, and action-oriented.");
        lines.add("Handle general questions too, not only farming questions.");
        lines.add("If details are missing, ask one short follow-up question instead of guessing.");
        lines.add("Use short paragraphs or simple bullets when that improves clarity.");
        lines.add("If the user shares an image, describe what is visible, explain your confidence level, and avoid pretending to be certain when the image is ambiguous.");

        String role = safeText(request.getRole()).toUpperCase(Locale.ROOT);
        if (!role.isBlank()) {
            lines.add("Current user role: " + role + ".");
        }

        String userName = safeText(request.getUserName());
        if (!userName.isBlank()) {
            lines.add("Current user name: " + userName + ".");
        }

        return String.join("\n", lines);
    }

    private boolean hasImage(AiChatRequest request) {
        return !safeText(request.getImage()).isBlank();
    }

    private boolean isConfigured() {
        String normalizedKey = safeText(apiKey).toLowerCase(Locale.ROOT);
        return !normalizedKey.isBlank()
                && !normalizedKey.contains("your_gemini_key_here");
    }

    private String extractMimeType(String metadata) {
        String lower = safeText(metadata).toLowerCase(Locale.ROOT);
        int startIndex = lower.indexOf(':');
        int endIndex = lower.indexOf(';');

        if (startIndex >= 0 && endIndex > startIndex) {
            String mimeType = lower.substring(startIndex + 1, endIndex).trim();
            if (!mimeType.isBlank()) {
                return mimeType;
            }
        }

        return "image/jpeg";
    }

    private String normalizeModel(String configuredModel) {
        String normalized = safeText(configuredModel);
        if (normalized.startsWith("models/")) {
            return normalized.substring("models/".length());
        }
        return normalized.isBlank() ? "gemini-1.5-flash" : normalized;
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    public record GeneratedReply(String text, String provider) {
    }
}
