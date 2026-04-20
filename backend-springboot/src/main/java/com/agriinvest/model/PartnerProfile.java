package com.agriinvest.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "partner_profiles")
public class PartnerProfile {

    @Id
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
    private String adminRemarks;
    private Instant updatedAt;

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills == null ? new ArrayList<>() : new ArrayList<>(skills);
    }

    public List<String> getDistricts() {
        return districts;
    }

    public void setDistricts(List<String> districts) {
        this.districts = districts == null ? new ArrayList<>() : new ArrayList<>(districts);
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public String getAadhaarFileName() {
        return aadhaarFileName;
    }

    public void setAadhaarFileName(String aadhaarFileName) {
        this.aadhaarFileName = aadhaarFileName;
    }

    public List<String> getCertificateFileNames() {
        return certificateFileNames;
    }

    public void setCertificateFileNames(List<String> certificateFileNames) {
        this.certificateFileNames = certificateFileNames == null
                ? new ArrayList<>()
                : new ArrayList<>(certificateFileNames);
    }

    public List<String> getAdditionalDocumentNames() {
        return additionalDocumentNames;
    }

    public void setAdditionalDocumentNames(List<String> additionalDocumentNames) {
        this.additionalDocumentNames = additionalDocumentNames == null
                ? new ArrayList<>()
                : new ArrayList<>(additionalDocumentNames);
    }

    public String getBankProofFileName() {
        return bankProofFileName;
    }

    public void setBankProofFileName(String bankProofFileName) {
        this.bankProofFileName = bankProofFileName;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getPaytmNumber() {
        return paytmNumber;
    }

    public void setPaytmNumber(String paytmNumber) {
        this.paytmNumber = paytmNumber;
    }

    public String getPhotoDataUrl() {
        return photoDataUrl;
    }

    public void setPhotoDataUrl(String photoDataUrl) {
        this.photoDataUrl = photoDataUrl;
    }

    public int getCompletionPercent() {
        return completionPercent;
    }

    public void setCompletionPercent(int completionPercent) {
        this.completionPercent = completionPercent;
    }

    public boolean isReadyForProjects() {
        return readyForProjects;
    }

    public void setReadyForProjects(boolean readyForProjects) {
        this.readyForProjects = readyForProjects;
    }

    public String getAdminRemarks() {
        return adminRemarks;
    }

    public void setAdminRemarks(String adminRemarks) {
        this.adminRemarks = adminRemarks;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
