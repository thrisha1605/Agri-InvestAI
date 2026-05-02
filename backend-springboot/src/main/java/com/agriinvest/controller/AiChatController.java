package com.agriinvest.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.dto.AiChatRequest;
import com.agriinvest.dto.AiChatResponse;
import com.agriinvest.service.AiChatHistoryService;
import com.agriinvest.service.AiChatService;
import com.agriinvest.service.GeminiChatService;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;
    private final GeminiChatService geminiChatService;
    private final AiChatHistoryService aiChatHistoryService;

    public AiChatController(AiChatService aiChatService,
                            GeminiChatService geminiChatService,
                            AiChatHistoryService aiChatHistoryService) {
        this.aiChatService = aiChatService;
        this.geminiChatService = geminiChatService;
        this.aiChatHistoryService = aiChatHistoryService;
    }

    @PostMapping("/chat")
    public AiChatResponse chat(@RequestAttribute(value = "authenticatedUserId", required = false) String authenticatedUserId,
                               @RequestBody AiChatRequest request) {
        Optional<GeminiChatService.GeneratedReply> generatedReply = geminiChatService.generateResponse(request);
        String reply = generatedReply
                .map(GeminiChatService.GeneratedReply::text)
                .orElseGet(() -> aiChatService.getReply(request));
        String provider = generatedReply
                .map(GeminiChatService.GeneratedReply::provider)
                .orElse("rules-based");
        String resolvedUserId = resolveUserId(authenticatedUserId, request == null ? null : request.getUserId());

        aiChatHistoryService.saveTurn(
                resolvedUserId,
                request == null ? null : request.getRole(),
                request == null ? null : request.getUserName(),
                request,
                reply,
                provider
        );

        return new AiChatResponse(reply, provider);
    }

    @GetMapping("/chat/history")
    public List<Map<String, Object>> history(@RequestAttribute(value = "authenticatedUserId", required = false) String authenticatedUserId,
                                             @RequestParam(required = false) String userId,
                                             @RequestParam(required = false) String role) {
        return aiChatHistoryService.getHistory(resolveUserId(authenticatedUserId, userId), role);
    }

    @DeleteMapping("/chat/history")
    public Map<String, String> clearHistory(@RequestAttribute(value = "authenticatedUserId", required = false) String authenticatedUserId,
                                            @RequestParam(required = false) String userId,
                                            @RequestParam(required = false) String role) {
        String resolvedUserId = resolveUserId(authenticatedUserId, userId);
        aiChatHistoryService.clearHistory(resolvedUserId, role);
        aiChatService.resetConversation(resolvedUserId, role);
        return Map.of("message", "Chat history cleared");
    }

    private String resolveUserId(String authenticatedUserId, String requestedUserId) {
        if (authenticatedUserId != null && !authenticatedUserId.isBlank()) {
            return authenticatedUserId;
        }
        if (requestedUserId != null && !requestedUserId.isBlank()) {
            return requestedUserId.trim();
        }
        return "guest";
    }
}
