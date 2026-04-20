package com.agriinvest.dto;

public class CreateAdvisoryRequest {

    private String projectId;
    private String partnerId;
    private String createdBy;
    private String title;
    private String description;
    private String createdAt;

    public CreateAdvisoryRequest() {
    }

    public String getProjectId() {
        return projectId;
    }

    public String getPartnerId() {
        return partnerId;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setPartnerId(String partnerId) {
        this.partnerId = partnerId;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}