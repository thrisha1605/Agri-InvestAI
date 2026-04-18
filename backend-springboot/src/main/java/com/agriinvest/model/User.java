package com.agriinvest.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users") // ✅ REQUIRED
public class User {

    @Id // ✅ REQUIRED
    private String id;

    private String name;
    private String email;
    private String phone;
    private String password;
    private String role;
    private String otp;
    private String otpId;

    public User() {}

    public User(String id, String name, String email, String phone, String password, String role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.role = role;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getOtp() { return otp; }
public void setOtp(String otp) { this.otp = otp; }

public String getOtpId() { return otpId; }
public void setOtpId(String otpId) { this.otpId = otpId; }
}