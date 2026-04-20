package com.agriinvest.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "projects")
public class Project {

    @Id
    private String id;

    private String farmerId;
    private String farmerName;
    private String title;
    private String cropType;
    private double targetAmount;
    private double raisedAmount;
    private String riskLevel;
    private double currentAmount;
    private String status;
    private String assignedPartnerId;
    private String assignedPartnerName;
    private double monthlyPartnerSalary;
    private int investorCount;
    private double investorTotalAmount;
    private double totalProfitAmount;
    private double platformFeeAmount;
    private double partnerSalaryTotal;
    private double investorShareAmount;
    private double farmerProfitAmount;
    private double distributableProfitAmount;
    private Map<String, Object> attributes = new LinkedHashMap<>();
    private Instant completedAt;
    private Instant createdAt;

    public Project() {
    }

    public Project(String id,
                   String farmerId,
                   String title,
                   String cropType,
                   double targetAmount,
                   double currentAmount,
                   String riskLevel,
                   String status,
                   Instant createdAt) {
        this.id = id;
        this.farmerId = farmerId;
        this.title = title;
        this.cropType = cropType;
        this.targetAmount = targetAmount;
        this.currentAmount = currentAmount;
        this.raisedAmount = currentAmount;
        this.riskLevel = riskLevel;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(String farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCropType() {
        return cropType;
    }

    public void setCropType(String cropType) {
        this.cropType = cropType;
    }

    public double getTargetAmount() {
        return targetAmount;
    }

    public void setTargetAmount(double targetAmount) {
        this.targetAmount = targetAmount;
    }

    public double getRaisedAmount() {
        return raisedAmount;
    }

    public void setRaisedAmount(double raisedAmount) {
        this.raisedAmount = raisedAmount;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public double getCurrentAmount() {
        return currentAmount;
    }

    public void setCurrentAmount(double currentAmount) {
        this.currentAmount = currentAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAssignedPartnerId() {
        return assignedPartnerId;
    }

    public void setAssignedPartnerId(String assignedPartnerId) {
        this.assignedPartnerId = assignedPartnerId;
    }

    public String getAssignedPartnerName() {
        return assignedPartnerName;
    }

    public void setAssignedPartnerName(String assignedPartnerName) {
        this.assignedPartnerName = assignedPartnerName;
    }

    public double getMonthlyPartnerSalary() {
        return monthlyPartnerSalary;
    }

    public void setMonthlyPartnerSalary(double monthlyPartnerSalary) {
        this.monthlyPartnerSalary = monthlyPartnerSalary;
    }

    public int getInvestorCount() {
        return investorCount;
    }

    public void setInvestorCount(int investorCount) {
        this.investorCount = investorCount;
    }

    public double getInvestorTotalAmount() {
        return investorTotalAmount;
    }

    public void setInvestorTotalAmount(double investorTotalAmount) {
        this.investorTotalAmount = investorTotalAmount;
    }

    public double getTotalProfitAmount() {
        return totalProfitAmount;
    }

    public void setTotalProfitAmount(double totalProfitAmount) {
        this.totalProfitAmount = totalProfitAmount;
    }

    public double getPlatformFeeAmount() {
        return platformFeeAmount;
    }

    public void setPlatformFeeAmount(double platformFeeAmount) {
        this.platformFeeAmount = platformFeeAmount;
    }

    public double getPartnerSalaryTotal() {
        return partnerSalaryTotal;
    }

    public void setPartnerSalaryTotal(double partnerSalaryTotal) {
        this.partnerSalaryTotal = partnerSalaryTotal;
    }

    public double getInvestorShareAmount() {
        return investorShareAmount;
    }

    public void setInvestorShareAmount(double investorShareAmount) {
        this.investorShareAmount = investorShareAmount;
    }

    public double getFarmerProfitAmount() {
        return farmerProfitAmount;
    }

    public void setFarmerProfitAmount(double farmerProfitAmount) {
        this.farmerProfitAmount = farmerProfitAmount;
    }

    public double getDistributableProfitAmount() {
        return distributableProfitAmount;
    }

    public void setDistributableProfitAmount(double distributableProfitAmount) {
        this.distributableProfitAmount = distributableProfitAmount;
    }

    public Map<String, Object> getAttributes() {
        return attributes;
    }

    public void setAttributes(Map<String, Object> attributes) {
        this.attributes = attributes == null ? new LinkedHashMap<>() : new LinkedHashMap<>(attributes);
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
