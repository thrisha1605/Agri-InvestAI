package com.agriinvest.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.dto.AiChatRequest;
import com.agriinvest.dto.AiChatResponse;
import com.agriinvest.service.AiChatService;
import com.agriinvest.service.GeminiChatService;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private final AiChatService aiChatService;
    private final GeminiChatService geminiChatService;

    public AiChatController(AiChatService aiChatService, GeminiChatService geminiChatService) {
        this.aiChatService = aiChatService;
        this.geminiChatService = geminiChatService;
    }

    @PostMapping("/chat")
    public AiChatResponse chat(@RequestBody AiChatRequest request) {
        String reply = geminiChatService.generateReply(request)
                .orElseGet(() -> aiChatService.getReply(
                        request.getMessage(),
                        request.getRole(),
                        request.getUserId(),
                        request.getImage()
                ));

        return new AiChatResponse(reply);
    }
}
