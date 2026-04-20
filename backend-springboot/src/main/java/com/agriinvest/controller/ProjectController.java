package com.agriinvest.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.model.Milestone;
import com.agriinvest.model.Project;
import com.agriinvest.service.ProjectService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    public record CreateProjectRequest(@NotBlank String title,
                                       @NotBlank String cropType,
                                       @Positive double targetAmount,
                                       @NotBlank String riskLevel) {
    }

    public record MilestoneRequest(@NotBlank String title, @NotBlank String status, String notes) {
    }

    public record PartnerSettlementRequest(String partnerId, String partnerName, @PositiveOrZero double monthlySalary) {
    }

    public record CompleteProjectRequest(@PositiveOrZero double totalProfit,
                                         Integer monthsWorked,
                                         List<PartnerSettlementRequest> partners) {
    }

    @GetMapping
    public List<Project> allProjects(@RequestParam(required = false) String farmerId) {
        if (farmerId != null && !farmerId.isBlank()) {
            return projectService.findProjectsByFarmer(farmerId);
        }
        return projectService.allProjects();
    }

    @GetMapping("/mine")
    public List<Project> myProjects(@RequestAttribute("authenticatedUserId") String farmerId) {
        return projectService.findProjectsByFarmer(farmerId);
    }

    @GetMapping("/{projectId}")
    public Project getProject(@PathVariable String projectId) {
        return projectService.getProjectById(projectId);
    }

    @PostMapping
    public Project create(@RequestAttribute("authenticatedUserId") String farmerId,
                          @RequestBody CreateProjectRequest request) {
        return projectService.createProject(
                farmerId,
                request.title(),
                request.cropType(),
                request.targetAmount(),
                request.riskLevel()
        );
    }

    @PostMapping("/detailed")
    public Project createDetailed(@RequestAttribute("authenticatedUserId") String farmerId,
                                  @RequestBody Map<String, Object> payload) {
        return projectService.createProjectFromPayload(farmerId, payload);
    }

    @PutMapping("/{projectId}")
    public Project updateProject(@PathVariable String projectId,
                                 @RequestBody Map<String, Object> payload) {
        return projectService.updateProject(projectId, payload);
    }

    @GetMapping("/{projectId}/milestones")
    public List<Milestone> milestones(@PathVariable String projectId) {
        return projectService.getMilestones(projectId);
    }

    @PostMapping("/{projectId}/milestones")
    public Milestone addMilestone(@PathVariable String projectId,
                                  @RequestBody MilestoneRequest request) {
        return projectService.addMilestone(
                projectId,
                request.title(),
                request.status(),
                request.notes()
        );
    }

    @GetMapping("/{projectId}/investor-summary")
    public Map<String, Object> investorSummary(@PathVariable String projectId) {
        return projectService.investmentSummary(projectId);
    }

    @GetMapping("/{projectId}/settlement-preview")
    public Map<String, Object> settlementPreview(@PathVariable String projectId,
                                                 @RequestParam double totalProfit,
                                                 @RequestParam(required = false) Integer monthsWorked) {
        return projectService.settlementPreview(projectId, totalProfit, monthsWorked, List.of());
    }

    @PostMapping("/{projectId}/complete")
    public Map<String, Object> completeProject(@PathVariable String projectId,
                                               @RequestBody CompleteProjectRequest request) {
        List<ProjectService.PartnerPayoutInput> partners = request.partners() == null
                ? List.of()
                : request.partners().stream()
                    .map(partner -> new ProjectService.PartnerPayoutInput(
                            partner.partnerId(),
                            partner.partnerName(),
                            partner.monthlySalary()
                    ))
                    .toList();

        return projectService.completeProject(
                projectId,
                request.totalProfit(),
                request.monthsWorked(),
                partners
        );
    }

    @PutMapping("/approve/{id}")
    public Project approveProject(@PathVariable String id) {
        return projectService.approveProject(id);
    }

    @PutMapping("/reject/{id}")
    public Project reject(@PathVariable String id) {
        return projectService.rejectProject(id);
    }
}
