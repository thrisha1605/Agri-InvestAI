package com.agriinvest.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "otp_sessions")
public class OtpSession {

    @Id
    private String id;

    private String target;
    private String otp;
    private Instant createdAt;

    public OtpSession() {
    }

    public OtpSession(String id, String target, String otp, Instant createdAt) {
        this.id = id;
        this.target = target;
        this.otp = otp;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
