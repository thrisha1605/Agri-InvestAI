package com.agriinvest.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.agriinvest.model.PartnerProfile;
import com.agriinvest.repository.PartnerProfileRepository;

@Service
public class PartnerProfileService {

    private final PartnerProfileRepository partnerProfileRepository;

    public PartnerProfileService(PartnerProfileRepository partnerProfileRepository) {
        this.partnerProfileRepository = partnerProfileRepository;
    }

    public PartnerProfile getProfile(String userId) {
        return partnerProfileRepository.findById(userId)
                .map(this::normalizeAndClone)
                .orElseGet(() -> defaultProfile(userId));
    }

    public PartnerProfile saveProfile(String userId, PartnerProfile payload) {
        PartnerProfile profile = partnerProfileRepository.findById(userId)
                .orElseGet(() -> defaultProfile(userId));

        profile.setUserId(userId);
        profile.setHeadline(text(payload == null ? null : payload.getHeadline()));
        profile.setBio(text(payload == null ? null : payload.getBio()));
        profile.setExperienceYears(payload == null ? 0 : Math.max(payload.getExperienceYears(), 0));
        profile.setSkills(cleanList(payload == null ? null : payload.getSkills()));
        profile.setDistricts(cleanList(payload == null ? null : payload.getDistricts()));
        profile.setAadhaarNumber(text(payload == null ? null : payload.getAadhaarNumber()));
        profile.setAadhaarFileName(text(payload == null ? null : payload.getAadhaarFileName()));
        profile.setCertificateFileNames(cleanList(payload == null ? null : payload.getCertificateFileNames()));
        profile.setAdditionalDocumentNames(cleanList(payload == null ? null : payload.getAdditionalDocumentNames()));
        profile.setBankProofFileName(text(payload == null ? null : payload.getBankProofFileName()));
        profile.setUpiId(text(payload == null ? null : payload.getUpiId()));
        profile.setPaytmNumber(text(payload == null ? null : payload.getPaytmNumber()));
        profile.setPhotoDataUrl(text(payload == null ? null : payload.getPhotoDataUrl()));
        profile.setAdminRemarks(text(payload == null ? null : payload.getAdminRemarks()));
        profile.setUpdatedAt(Instant.now());

        applyCompletion(profile);
        return partnerProfileRepository.save(profile);
    }

    public List<PartnerProfile> listProfiles() {
        return partnerProfileRepository.findAll().stream()
                .map(this::normalizeAndClone)
                .sorted(Comparator.comparing(PartnerProfile::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private PartnerProfile normalizeAndClone(PartnerProfile source) {
        PartnerProfile profile = new PartnerProfile();
        profile.setUserId(source.getUserId());
        profile.setHeadline(text(source.getHeadline()));
        profile.setBio(text(source.getBio()));
        profile.setExperienceYears(Math.max(source.getExperienceYears(), 0));
        profile.setSkills(cleanList(source.getSkills()));
        profile.setDistricts(cleanList(source.getDistricts()));
        profile.setAadhaarNumber(text(source.getAadhaarNumber()));
        profile.setAadhaarFileName(text(source.getAadhaarFileName()));
        profile.setCertificateFileNames(cleanList(source.getCertificateFileNames()));
        profile.setAdditionalDocumentNames(cleanList(source.getAdditionalDocumentNames()));
        profile.setBankProofFileName(text(source.getBankProofFileName()));
        profile.setUpiId(text(source.getUpiId()));
        profile.setPaytmNumber(text(source.getPaytmNumber()));
        profile.setPhotoDataUrl(text(source.getPhotoDataUrl()));
        profile.setAdminRemarks(text(source.getAdminRemarks()));
        profile.setUpdatedAt(source.getUpdatedAt() == null ? Instant.now() : source.getUpdatedAt());
        applyCompletion(profile);
        return profile;
    }

    private PartnerProfile defaultProfile(String userId) {
        PartnerProfile profile = new PartnerProfile();
        profile.setUserId(userId);
        profile.setHeadline("");
        profile.setBio("");
        profile.setExperienceYears(0);
        profile.setSkills(List.of());
        profile.setDistricts(List.of());
        profile.setAadhaarNumber("");
        profile.setAadhaarFileName("");
        profile.setCertificateFileNames(List.of());
        profile.setAdditionalDocumentNames(List.of());
        profile.setBankProofFileName("");
        profile.setUpiId("");
        profile.setPaytmNumber("");
        profile.setPhotoDataUrl("");
        profile.setAdminRemarks("");
        profile.setUpdatedAt(Instant.now());
        applyCompletion(profile);
        return profile;
    }

    private void applyCompletion(PartnerProfile profile) {
        int points = 0;

        if (!profile.getHeadline().isBlank()) points += 15;
        if (!profile.getBio().isBlank()) points += 15;
        if (!profile.getPhotoDataUrl().isBlank()) points += 15;
        if (!profile.getSkills().isEmpty()) points += 10;
        if (profile.getExperienceYears() > 0) points += 10;
        if (!profile.getDistricts().isEmpty()) points += 10;
        if (!profile.getAadhaarNumber().isBlank() && !profile.getAadhaarFileName().isBlank()) points += 15;
        if (!profile.getCertificateFileNames().isEmpty()) points += 5;
        if (!profile.getAdditionalDocumentNames().isEmpty() || !profile.getBankProofFileName().isBlank()) points += 5;

        int percent = Math.min(100, points);
        boolean ready = !profile.getPhotoDataUrl().isBlank()
                && !profile.getAadhaarNumber().isBlank()
                && !profile.getAadhaarFileName().isBlank()
                && !profile.getCertificateFileNames().isEmpty()
                && !profile.getSkills().isEmpty()
                && percent >= 80;

        profile.setCompletionPercent(percent);
        profile.setReadyForProjects(ready);
    }

    private List<String> cleanList(List<String> source) {
        List<String> result = new ArrayList<>();
        if (source == null) {
            return result;
        }

        for (String item : source) {
            String normalized = text(item);
            if (!normalized.isBlank()) {
                result.add(normalized);
            }
        }
        return result;
    }

    private String text(String value) {
        return value == null ? "" : value.trim();
    }
}
