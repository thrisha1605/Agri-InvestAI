package com.agriinvest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.dto.CreateAdvisoryRequest;
import com.agriinvest.dto.CreateMilestoneUpdateRequest;
import com.agriinvest.dto.CreateWithdrawalRequest;
import com.agriinvest.model.AdvisoryReport;
import com.agriinvest.model.ProjectMilestoneUpdate;
import com.agriinvest.model.WithdrawalRequest;
import com.agriinvest.service.ProjectTrackingService;

@RestController
@RequestMapping("/api/project-tracking")
public class ProjectTrackingController {

    public record AdminReviewRequest(String adminRemark) {
    }

    private final ProjectTrackingService trackingService;

    public ProjectTrackingController(ProjectTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    @PostMapping("/updates")
    public ProjectMilestoneUpdate createUpdate(@RequestBody CreateMilestoneUpdateRequest request) {
        return trackingService.createMilestoneUpdate(request);
    }

    @GetMapping("/{projectId}/updates")
    public List<ProjectMilestoneUpdate> getUpdates(@PathVariable String projectId) {
        return trackingService.getProjectUpdates(projectId);
    }

    @PutMapping("/updates/{id}/approve")
    public ProjectMilestoneUpdate approveUpdate(@PathVariable String id) {
        return trackingService.approveMilestone(id);
    }

    @PutMapping("/updates/{id}/reject")
    public ProjectMilestoneUpdate rejectUpdate(@PathVariable String id) {
        return trackingService.rejectMilestone(id);
    }

    @PostMapping("/withdrawals")
    public WithdrawalRequest createWithdrawal(@RequestBody CreateWithdrawalRequest request) {
        return trackingService.createWithdrawal(request);
    }

    @GetMapping("/withdrawals")
    public List<WithdrawalRequest> listWithdrawals(@org.springframework.web.bind.annotation.RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return trackingService.getWithdrawalsByStatus(status);
        }
        return trackingService.getAllWithdrawals();
    }

    @GetMapping("/{projectId}/withdrawals")
    public List<WithdrawalRequest> getWithdrawals(@PathVariable String projectId) {
        return trackingService.getProjectWithdrawals(projectId);
    }

    @PutMapping("/withdrawals/{id}/approve")
    public WithdrawalRequest approveWithdrawal(@PathVariable String id,
                                               @RequestBody(required = false) AdminReviewRequest request) {
        return trackingService.approveWithdrawal(id, request == null ? null : request.adminRemark());
    }

    @PutMapping("/withdrawals/{id}/reject")
    public WithdrawalRequest rejectWithdrawal(@PathVariable String id,
                                              @RequestBody(required = false) AdminReviewRequest request) {
        return trackingService.rejectWithdrawal(id, request == null ? null : request.adminRemark());
    }

    @PostMapping("/advisories")
    public AdvisoryReport createAdvisory(@RequestBody CreateAdvisoryRequest request) {
        return trackingService.createAdvisory(request);
    }

    @GetMapping("/{projectId}/advisories")
    public List<AdvisoryReport> getAdvisories(@PathVariable String projectId) {
        return trackingService.getProjectAdvisories(projectId);
    }

    @PostMapping("/profit/calculate")
    public Map<String, Object> calculateProfit(@RequestBody Map<String, Double> request) {
        double revenue = request.getOrDefault("revenue", 0.0);
        double expenses = request.getOrDefault("expenses", 0.0);
        return trackingService.calculateProfit(revenue, expenses);
    }
}
