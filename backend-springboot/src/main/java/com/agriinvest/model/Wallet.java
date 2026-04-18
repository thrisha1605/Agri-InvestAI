package com.agriinvest.model;

public class Wallet {
    private String userId;
    private double principal;
    private double profits;
    private double refunds;
    private double sip;

    public Wallet() {}

    public Wallet(String userId, double principal, double profits, double refunds, double sip) {
        this.userId = userId;
        this.principal = principal;
        this.profits = profits;
        this.refunds = refunds;
        this.sip = sip;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public double getPrincipal() { return principal; }
    public void setPrincipal(double principal) { this.principal = principal; }
    public double getProfits() { return profits; }
    public void setProfits(double profits) { this.profits = profits; }
    public double getRefunds() { return refunds; }
    public void setRefunds(double refunds) { this.refunds = refunds; }
    public double getSip() { return sip; }
    public void setSip(double sip) { this.sip = sip; }
    public double getBalance() { return principal + profits + refunds + sip; }
}
