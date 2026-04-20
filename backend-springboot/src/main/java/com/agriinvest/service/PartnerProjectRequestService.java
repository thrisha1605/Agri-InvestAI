package com.agriinvest.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.agriinvest.controller.PartnerProjectRequestController.AdminReviewRequest;
import com.agriinvest.controller.PartnerProjectRequestController.CreatePartnerProjectRequest;
import com.agriinvest.controller.PartnerProjectRequestController.PartnerProfilePayload;
import com.agriinvest.model.PartnerProjectRequest;
import com.agriinvest.model.Project;
import com.agriinvest.model.User;
import com.agriinvest.repository.PartnerProjectRequestRepository;
import com.agriinvest.repository.ProjectRepository;
import com.agriinvest.repository.UserRepository;

@Service
public class PartnerProjectRequestService {

    private final PartnerProjectRequestRepository requestRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public PartnerProjectRequestService(PartnerProjectRequestRepository requestRepository,
                                        ProjectRepository projectRepository,
                                        UserRepository userRepository) {
        this.requestRepository = requestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public PartnerProjectRequest createRequest(CreatePartnerProjectRequest request) {
        validateCreateRequest(request);

        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        User partner = userRepository.findById(request.partnerId())
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        User farmer = userRepository.findById(project.getFarmerId())
                .orElse(null);

        PartnerProjectRequest partnerProjectRequest = requestRepository
                .findByProjectIdAndPartnerId(request.projectId(), request.partnerId())
                .orElseGet(PartnerProjectRequest::new);

        Instant now = Instant.now();
        if (partnerProjectRequest.getCreatedAt() == null) {
            partnerProjectRequest.setCreatedAt(now);
        }

        partnerProjectRequest.setProjectId(project.getId());
        partnerProjectRequest.setProjectTitle(project.getTitle());
        partnerProjectRequest.setFarmerId(project.getFarmerId());
        partnerProjectRequest.setFarmerName(resolveFarmerName(project, farmer));
        partnerProjectRequest.setPartnerId(partner.getId());
        partnerProjectRequest.setPartnerName(defaultString(partner.getName()));
        partnerProjectRequest.setMessage(defaultString(request.message()));
        partnerProjectRequest.setStatus("PENDING");
        partnerProjectRequest.setAdminRemarks(null);
        partnerProjectRequest.setReviewedAt(null);
        partnerProjectRequest.setUpdatedAt(now);
        partnerProjectRequest.setPartnerProfile(toSnapshot(request.partnerProfile()));

        return requestRepository.save(partnerProjectRequest);
    }

    public List<PartnerProjectRequest> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PartnerProjectRequest> getPendingRequests() {
        return requestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public List<PartnerProjectRequest> getRequestsByStatus(String status) {
        return requestRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<PartnerProjectRequest> getRequestsByPartner(String partnerId) {
        return requestRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId);
    }

    public List<PartnerProjectRequest> getRequestsByProject(String projectId) {
        return requestRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public PartnerProjectRequest getRequestById(String requestId) {
        return requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Partner project request not found"));
    }

    public PartnerProjectRequest approveRequest(String requestId, AdminReviewRequest reviewRequest) {
        PartnerProjectRequest request = getRequestById(requestId);
        request.setStatus("APPROVED");
        request.setAdminRemarks(reviewRequest == null ? null : normalizeRemarks(reviewRequest.adminRemarks()));
        request.setReviewedAt(Instant.now());
        request.setUpdatedAt(Instant.now());

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setAssignedPartnerId(request.getPartnerId());
        project.setAssignedPartnerName(request.getPartnerName());
        Map<String, Object> attributes = new LinkedHashMap<>(project.getAttributes());
        attributes.put("assignedPartnerId", request.getPartnerId());
        attributes.put("assignedPartnerName", request.getPartnerName());
        attributes.put("workerRequestStatus", "ASSIGNED");
        attributes.put("helperRequestStatus", "CLOSED");
        attributes.put("helperNeeded", true);
        project.setAttributes(attributes);
        projectRepository.save(project);

        return requestRepository.save(request);
    }

    public PartnerProjectRequest rejectRequest(String requestId, AdminReviewRequest reviewRequest) {
        PartnerProjectRequest request = getRequestById(requestId);
        request.setStatus("REJECTED");
        request.setAdminRemarks(reviewRequest == null ? null : normalizeRemarks(reviewRequest.adminRemarks()));
        request.setReviewedAt(Instant.now());
        request.setUpdatedAt(Instant.now());
        return requestRepository.save(request);
    }

    private void validateCreateRequest(CreatePartnerProjectRequest request) {
        if (request == null) {
            throw new RuntimeException("Request body is required");
        }
        if (isBlank(request.projectId())) {
            throw new RuntimeException("Project id is required");
        }
        if (isBlank(request.partnerId())) {
            throw new RuntimeException("Partner id is required");
        }
        if (request.partnerProfile() == null) {
            throw new RuntimeException("Partner profile is required");
        }
        if (isBlank(request.partnerProfile().userId())) {
            throw new RuntimeException("Partner profile userId is required");
        }
        if (!request.partnerId().equals(request.partnerProfile().userId())) {
            throw new RuntimeException("partnerId and partnerProfile.userId must match");
        }
    }

    private PartnerProjectRequest.PartnerProfileSnapshot toSnapshot(PartnerProfilePayload payload) {
        PartnerProjectRequest.PartnerProfileSnapshot snapshot = new PartnerProjectRequest.PartnerProfileSnapshot();
        snapshot.setUserId(payload.userId());
        snapshot.setHeadline(defaultString(payload.headline()));
        snapshot.setBio(defaultString(payload.bio()));
        snapshot.setExperienceYears(payload.experienceYears() == null ? 0 : Math.max(payload.experienceYears(), 0));
        snapshot.setSkills(payload.skills());
        snapshot.setDistricts(payload.districts());
        snapshot.setAadhaarNumber(defaultString(payload.aadhaarNumber()));
        snapshot.setAadhaarFileName(defaultString(payload.aadhaarFileName()));
        snapshot.setCertificateFileNames(payload.certificateFileNames());
        snapshot.setAdditionalDocumentNames(payload.additionalDocumentNames());
        snapshot.setBankProofFileName(defaultString(payload.bankProofFileName()));
        snapshot.setUpiId(defaultString(payload.upiId()));
        snapshot.setPaytmNumber(defaultString(payload.paytmNumber()));
        snapshot.setPhotoDataUrl(defaultString(payload.photoDataUrl()));
        snapshot.setCompletionPercent(payload.completionPercent() == null ? 0 : Math.max(payload.completionPercent(), 0));
        snapshot.setReadyForProjects(Boolean.TRUE.equals(payload.readyForProjects()));
        snapshot.setUpdatedAt(payload.updatedAt() == null ? Instant.now() : payload.updatedAt());
        return snapshot;
    }

    private String normalizeRemarks(String remarks) {
        return isBlank(remarks) ? null : remarks.trim();
    }

    private String resolveFarmerName(Project project, User farmer) {
        if (farmer != null && !isBlank(farmer.getName())) {
            return farmer.getName();
        }

        if (!isBlank(project.getFarmerName())) {
            return project.getFarmerName();
        }

        Object storedName = project.getAttributes().get("farmerName");
        return storedName == null ? "" : String.valueOf(storedName);
    }

    private String defaultString(String value) {
        return value == null ? "" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
