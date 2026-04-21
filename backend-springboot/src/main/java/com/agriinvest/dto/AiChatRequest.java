package com.agriinvest.dto;

import java.util.ArrayList;
import java.util.List;

public class AiChatRequest {
    private String message;
    private String role;
    private String userId;
    private String userName;
    private String image;
    private List<AiChatTurn> history = new ArrayList<>();

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<AiChatTurn> getHistory() {
        return history;
    }

    public void setHistory(List<AiChatTurn> history) {
        this.history = history == null ? new ArrayList<>() : history;
    }

    public static class AiChatTurn {
        private String sender;
        private String text;
        private String image;

        public String getSender() {
            return sender;
        }

        public void setSender(String sender) {
            this.sender = sender;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }
    }
}
