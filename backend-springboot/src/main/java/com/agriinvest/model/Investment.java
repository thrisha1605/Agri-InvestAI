package com.agriinvest.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "investments")
public class Investment {
    @Id
    private String id;
    private String investorId;
    private String projectId;
    private double amount;
    private String paymentMethod;
    private String cropType;
    private String status;
    private double expectedRoi;
    private double actualRoi;
    private Instant createdAt;
    private double expectedReturn;
    private double profit;

    public Investment() {}

    public Investment(String id, String investorId, String projectId, double amount, String paymentMethod, String cropType, String status, double expectedRoi, double actualRoi, Instant createdAt) {
        this.id = id;
        this.investorId = investorId;
        this.projectId = projectId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.cropType = cropType;
        this.status = status;
        this.expectedRoi = expectedRoi;
        this.actualRoi = actualRoi;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getInvestorId() { return investorId; }
    public void setInvestorId(String investorId) { this.investorId = investorId; }
    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getCropType() { return cropType; }
    public void setCropType(String cropType) { this.cropType = cropType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getExpectedRoi() { return expectedRoi; }
    public void setExpectedRoi(double expectedRoi) { this.expectedRoi = expectedRoi; }
    public double getActualRoi() { return actualRoi; }
    public void setActualRoi(double actualRoi) { this.actualRoi = actualRoi; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public double getExpectedReturn() {
    return expectedReturn;
}

public void setExpectedReturn(double expectedReturn) {
    this.expectedReturn = expectedReturn;
}

public double getProfit() {
    return profit;
}

public void setProfit(double profit) {
    this.profit = profit;
}
}
