package com.agriinvest.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "wallet_accounts")
public class WalletAccount {

    @Id
    private String userId;

    private double principal;
    private double profits;
    private double refunds;
    private double sip;
    private Instant updatedAt;

    public WalletAccount() {
    }

    public WalletAccount(String userId) {
        this.userId = userId;
        this.updatedAt = Instant.now();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public double getPrincipal() {
        return principal;
    }

    public void setPrincipal(double principal) {
        this.principal = principal;
    }

    public double getProfits() {
        return profits;
    }

    public void setProfits(double profits) {
        this.profits = profits;
    }

    public double getRefunds() {
        return refunds;
    }

    public void setRefunds(double refunds) {
        this.refunds = refunds;
    }

    public double getSip() {
        return sip;
    }

    public void setSip(double sip) {
        this.sip = sip;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public double getBalance() {
        return principal + profits + refunds + sip;
    }
}
