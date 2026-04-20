package com.agriinvest.dto;

public class CreateMilestoneUpdateRequest {

    private String id;
    private String projectId;
    private String farmerId;
    private String milestoneKey;
    private String title;
    private String notes;
    private String date;
    private String createdAt;
    private String cropHealth;
    private String proofName;
    private String proofImage;

    public CreateMilestoneUpdateRequest() {
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

    public String getMilestoneKey() {
        return milestoneKey;
    }

    public String getTitle() {
        return title;
    }

    public String getNotes() {
        return notes;
    }

    public String getDate() {
        return date;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public String getCropHealth() {
        return cropHealth;
    }

    public String getProofName() {
        return proofName;
    }

    public String getProofImage() {
        return proofImage;
    }

    public void setId(String id) {
        this.id = id;
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

    public void setTitle(String title) {
        this.title = title;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public void setCropHealth(String cropHealth) {
        this.cropHealth = cropHealth;
    }

    public void setProofName(String proofName) {
        this.proofName = proofName;
    }

    public void setProofImage(String proofImage) {
        this.proofImage = proofImage;
    }
}
