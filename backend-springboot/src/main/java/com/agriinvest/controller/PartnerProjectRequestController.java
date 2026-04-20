package com.agriinvest.controller;

import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.model.PartnerProjectRequest;
import com.agriinvest.service.PartnerProjectRequestService;

@RestController
@RequestMapping({"/api/partner-requests", "/api/admin/worker-requests"})
public class PartnerProjectRequestController {

    private final PartnerProjectRequestService partnerProjectRequestService;

    public PartnerProjectRequestController(PartnerProjectRequestService partnerProjectRequestService) {
        this.partnerProjectRequestService = partnerProjectRequestService;
    }

    public record PartnerProfilePayload(
            @NotBlank String userId,
            String headline,
            String bio,
            Integer experienceYears,
            List<String> skills,
            List<String> districts,
            String aadhaarNumber,
            String aadhaarFileName,
            List<String> certificateFileNames,
            List<String> additionalDocumentNames,
            String bankProofFileName,
            String upiId,
            String paytmNumber,
            String photoDataUrl,
            Integer completionPercent,
            Boolean readyForProjects,
            Instant updatedAt
    ) {
    }

    public record CreatePartnerProjectRequest(
            @NotBlank String projectId,
            @NotBlank String partnerId,
            String message,
            @Valid PartnerProfilePayload partnerProfile
    ) {
    }

    public record AdminReviewRequest(String adminRemarks) {
    }

    @PostMapping
    public PartnerProjectRequest createRequest(@Valid @RequestBody CreatePartnerProjectRequest request) {
        return partnerProjectRequestService.createRequest(request);
    }

    @GetMapping
    public List<PartnerProjectRequest> listRequests(@RequestParam(required = false) String status,
                                                    @RequestParam(required = false) String partnerId,
                                                    @RequestParam(required = false) String projectId) {
        if (partnerId != null && !partnerId.isBlank()) {
            return partnerProjectRequestService.getRequestsByPartner(partnerId);
        }

        if (projectId != null && !projectId.isBlank()) {
            return partnerProjectRequestService.getRequestsByProject(projectId);
        }

        if (status != null && !status.isBlank()) {
            return partnerProjectRequestService.getRequestsByStatus(status.toUpperCase());
        }

        return partnerProjectRequestService.getAllRequests();
    }

    @GetMapping("/pending")
    public List<PartnerProjectRequest> pendingRequests() {
        return partnerProjectRequestService.getPendingRequests();
    }

    @GetMapping("/{requestId}")
    public PartnerProjectRequest getRequest(@PathVariable String requestId) {
        return partnerProjectRequestService.getRequestById(requestId);
    }

    @PutMapping("/{requestId}/approve")
    public PartnerProjectRequest approveRequest(@PathVariable String requestId,
                                                @RequestBody(required = false) AdminReviewRequest request) {
        return partnerProjectRequestService.approveRequest(requestId, request);
    }

    @PostMapping("/{requestId}/approve")
    public PartnerProjectRequest approveRequestCompat(@PathVariable String requestId,
                                                      @RequestBody(required = false) AdminReviewRequest request) {
        return partnerProjectRequestService.approveRequest(requestId, request);
    }

    @PutMapping("/{requestId}/reject")
    public PartnerProjectRequest rejectRequest(@PathVariable String requestId,
                                               @RequestBody(required = false) AdminReviewRequest request) {
        return partnerProjectRequestService.rejectRequest(requestId, request);
    }

    @PostMapping("/{requestId}/reject")
    public PartnerProjectRequest rejectRequestCompat(@PathVariable String requestId,
                                                     @RequestBody(required = false) AdminReviewRequest request) {
        return partnerProjectRequestService.rejectRequest(requestId, request);
    }
}
