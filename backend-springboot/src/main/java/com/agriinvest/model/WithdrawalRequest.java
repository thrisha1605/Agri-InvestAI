package com.agriinvest.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "withdrawal_requests")
public class WithdrawalRequest {

    @Id
    private String id;

    private String projectId;
    private String projectTitle;
    private String farmerId;
    private String farmerName;
    private String milestoneKey;
    private double amount;
    private String reason;
    private String date;
    private String status; // PENDING, APPROVED, REJECTED, DISBURSED
    private String adminRemark;
    private Instant reviewedAt;

    public WithdrawalRequest() {
    }

    public String getId() {
        return id;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public String getFarmerName() {
        return farmerName;
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

    public String getStatus() {
        return status;
    }

    public String getAdminRemark() {
        return adminRemark;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setProjectTitle(String projectTitle) {
        this.projectTitle = projectTitle;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
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

    public void setStatus(String status) {
        this.status = status;
    }

    public void setAdminRemark(String adminRemark) {
        this.adminRemark = adminRemark;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
