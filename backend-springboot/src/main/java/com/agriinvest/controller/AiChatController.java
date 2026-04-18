package com.agriinvest.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.dto.AiChatRequest;
import com.agriinvest.dto.AiChatResponse;
import com.agriinvest.service.AiChatService;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    @PostMapping("/chat")
    public AiChatResponse chat(@RequestBody AiChatRequest request) {
        String reply = aiChatService.getReply(
                request.getMessage(),
                request.getRole(),
                request.getUserId(),
                request.getImage()
        );

        return new AiChatResponse(reply);
    }
}
