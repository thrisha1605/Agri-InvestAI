package com.agriinvest.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "partner_project_requests")
public class PartnerProjectRequest {

    @Id
    private String id;

    private String projectId;
    private String projectTitle;
    private String farmerId;
    private String farmerName;
    private String partnerId;
    private String partnerName;
    private String message;
    private String status;
    private String adminRemarks;
    private Instant reviewedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private PartnerProfileSnapshot partnerProfile;

    public PartnerProjectRequest() {
    }

    public String getId() {
        return id;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public String getFarmerId() {
        return farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public String getPartnerId() {
        return partnerId;
    }

    public String getPartnerName() {
        return partnerName;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public PartnerProfileSnapshot getPartnerProfile() {
        return partnerProfile;
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

    public void setPartnerId(String partnerId) {
        this.partnerId = partnerId;
    }

    public void setPartnerName(String partnerName) {
        this.partnerName = partnerName;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setPartnerProfile(PartnerProfileSnapshot partnerProfile) {
        this.partnerProfile = partnerProfile;
    }

    public static class PartnerProfileSnapshot {
        private String userId;
        private String headline;
        private String bio;
        private int experienceYears;
        private List<String> skills = new ArrayList<>();
        private List<String> districts = new ArrayList<>();
        private String aadhaarNumber;
        private String aadhaarFileName;
        private List<String> certificateFileNames = new ArrayList<>();
        private List<String> additionalDocumentNames = new ArrayList<>();
        private String bankProofFileName;
        private String upiId;
        private String paytmNumber;
        private String photoDataUrl;
        private int completionPercent;
        private boolean readyForProjects;
        private Instant updatedAt;

        public PartnerProfileSnapshot() {
        }

        public String getUserId() {
            return userId;
        }

        public String getHeadline() {
            return headline;
        }

        public String getBio() {
            return bio;
        }

        public int getExperienceYears() {
            return experienceYears;
        }

        public List<String> getSkills() {
            return skills;
        }

        public List<String> getDistricts() {
            return districts;
        }

        public String getAadhaarNumber() {
            return aadhaarNumber;
        }

        public String getAadhaarFileName() {
            return aadhaarFileName;
        }

        public List<String> getCertificateFileNames() {
            return certificateFileNames;
        }

        public List<String> getAdditionalDocumentNames() {
            return additionalDocumentNames;
        }

        public String getBankProofFileName() {
            return bankProofFileName;
        }

        public String getUpiId() {
            return upiId;
        }

        public String getPaytmNumber() {
            return paytmNumber;
        }

        public String getPhotoDataUrl() {
            return photoDataUrl;
        }

        public int getCompletionPercent() {
            return completionPercent;
        }

        public boolean isReadyForProjects() {
            return readyForProjects;
        }

        public Instant getUpdatedAt() {
            return updatedAt;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public void setHeadline(String headline) {
            this.headline = headline;
        }

        public void setBio(String bio) {
            this.bio = bio;
        }

        public void setExperienceYears(int experienceYears) {
            this.experienceYears = experienceYears;
        }

        public void setSkills(List<String> skills) {
            this.skills = skills == null ? new ArrayList<>() : new ArrayList<>(skills);
        }

        public void setDistricts(List<String> districts) {
            this.districts = districts == null ? new ArrayList<>() : new ArrayList<>(districts);
        }

        public void setAadhaarNumber(String aadhaarNumber) {
            this.aadhaarNumber = aadhaarNumber;
        }

        public void setAadhaarFileName(String aadhaarFileName) {
            this.aadhaarFileName = aadhaarFileName;
        }

        public void setCertificateFileNames(List<String> certificateFileNames) {
            this.certificateFileNames = certificateFileNames == null ? new ArrayList<>() : new ArrayList<>(certificateFileNames);
        }

        public void setAdditionalDocumentNames(List<String> additionalDocumentNames) {
            this.additionalDocumentNames = additionalDocumentNames == null ? new ArrayList<>() : new ArrayList<>(additionalDocumentNames);
        }

        public void setBankProofFileName(String bankProofFileName) {
            this.bankProofFileName = bankProofFileName;
        }

        public void setUpiId(String upiId) {
            this.upiId = upiId;
        }

        public void setPaytmNumber(String paytmNumber) {
            this.paytmNumber = paytmNumber;
        }

        public void setPhotoDataUrl(String photoDataUrl) {
            this.photoDataUrl = photoDataUrl;
        }

        public void setCompletionPercent(int completionPercent) {
            this.completionPercent = completionPercent;
        }

        public void setReadyForProjects(boolean readyForProjects) {
            this.readyForProjects = readyForProjects;
        }

        public void setUpdatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
        }
    }
}