package com.agriinvest.dto;

public class CreateWithdrawalRequest {

    private String projectId;
    private String farmerId;
    private String milestoneKey;
    private double amount;
    private String reason;
    private String date;

    public CreateWithdrawalRequest() {
    }

    public String getProjectId() {
        return projectId;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public String getMilestoneKey() {
        return milestoneKey;
    }

    public double getAmount() {
        return amount;
    }

    public String getReason() {
        return reason;
    }

    public String getDate() {
        return date;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public void setMilestoneKey(String milestoneKey) {
        this.milestoneKey = milestoneKey;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public void setDate(String date) {
        this.date = date;
    }
}