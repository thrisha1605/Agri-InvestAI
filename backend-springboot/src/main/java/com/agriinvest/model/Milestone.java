package com.agriinvest.model;

import java.time.Instant;

public class Milestone {

    private String id;
    private String projectId;
    private String title;
    private String description; // ✅ IMPORTANT
    private String status;
    private Instant createdAt;

    public Milestone() {}

    public Milestone(String id, String projectId, String title, String status, String description, Instant createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.status = status;
        this.description = description;
        this.createdAt = createdAt;
    }

    // getters & setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {   // ✅ FIX
        return description;
    }

    public void setDescription(String description) {   // ✅ FIX
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}