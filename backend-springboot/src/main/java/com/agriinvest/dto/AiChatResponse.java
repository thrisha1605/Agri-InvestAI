package com.agriinvest.dto;

public class AiChatResponse {
    private String reply;
    private String provider;

    public AiChatResponse() {
    }

    public AiChatResponse(String reply) {
        this.reply = reply;
    }

    public AiChatResponse(String reply, String provider) {
        this.reply = reply;
        this.provider = provider;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }
}
