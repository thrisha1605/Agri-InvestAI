package com.agriinvest.service;

import com.agriinvest.dto.CreateAdvisoryRequest;
import com.agriinvest.dto.CreateMilestoneUpdateRequest;
import com.agriinvest.dto.CreateWithdrawalRequest;
import com.agriinvest.model.AdvisoryReport;
import com.agriinvest.model.Investment;
import com.agriinvest.model.Project;
import com.agriinvest.model.ProjectMilestoneUpdate;
import com.agriinvest.model.User;
import com.agriinvest.model.WithdrawalRequest;
import com.agriinvest.repository.AdvisoryReportRepository;
import com.agriinvest.repository.InvestmentRepository;
import com.agriinvest.repository.ProjectRepository;
import com.agriinvest.repository.ProjectMilestoneUpdateRepository;
import com.agriinvest.repository.UserRepository;
import com.agriinvest.repository.WithdrawalRequestRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProjectTrackingService {

    private final ProjectMilestoneUpdateRepository updateRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final AdvisoryReportRepository advisoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final InvestmentRepository investmentRepository;
    private final NotificationService notificationService;

    public ProjectTrackingService(
            ProjectMilestoneUpdateRepository updateRepository,
            WithdrawalRequestRepository withdrawalRepository,
            AdvisoryReportRepository advisoryRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            InvestmentRepository investmentRepository,
            NotificationService notificationService
    ) {
        this.updateRepository = updateRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.advisoryRepository = advisoryRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.investmentRepository = investmentRepository;
        this.notificationService = notificationService;
    }

    public ProjectMilestoneUpdate createMilestoneUpdate(CreateMilestoneUpdateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User farmer = userRepository.findById(request.getFarmerId()).orElse(null);

        ProjectMilestoneUpdate update = new ProjectMilestoneUpdate();
        if (!isBlank(request.getId())) {
            update.setId(request.getId());
        }
        update.setProjectId(request.getProjectId());
        update.setFarmerId(request.getFarmerId());
        update.setMilestoneKey(request.getMilestoneKey());
        update.setTitle(request.getTitle());
        update.setNotes(request.getNotes());
        update.setDate(request.getDate());
        update.setCreatedAt(isBlank(request.getCreatedAt()) ? Instant.now().toString() : request.getCreatedAt());
        update.setCropHealth(request.getCropHealth());
        update.setProofName(request.getProofName());
        update.setProofImage(request.getProofImage());
        update.setStatus("PENDING");
        ProjectMilestoneUpdate savedUpdate = updateRepository.save(update);

        String farmerName = resolveFarmerName(project, farmer);
        String message = project.getTitle() + ": " + request.getTitle();

        notificationService.notifyRole(
                "ADMIN",
                "PROJECT_UPDATE",
                "New milestone update submitted",
                farmerName + " shared a milestone update for \"" + project.getTitle() + "\".",
                "/admin/projects",
                projectMetadata(project)
        );

        notificationService.notifyUsers(
                investorIds(project.getId()),
                "PROJECT_UPDATE",
                "Project progress update",
                message,
                "/projects/" + project.getId(),
                projectMetadata(project)
        );

        return savedUpdate;
    }

    public List<ProjectMilestoneUpdate> getProjectUpdates(String projectId) {
        return updateRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public WithdrawalRequest createWithdrawal(CreateWithdrawalRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User farmer = userRepository.findById(request.getFarmerId())
                .orElse(null);

        WithdrawalRequest withdrawal = new WithdrawalRequest();
        withdrawal.setProjectId(request.getProjectId());
        withdrawal.setProjectTitle(project.getTitle());
        withdrawal.setFarmerId(request.getFarmerId());
        withdrawal.setFarmerName(resolveFarmerName(project, farmer));
        withdrawal.setMilestoneKey(request.getMilestoneKey());
        withdrawal.setAmount(request.getAmount());
        withdrawal.setReason(request.getReason());
        withdrawal.setDate(isBlank(request.getDate()) ? Instant.now().toString() : request.getDate());
        withdrawal.setStatus("PENDING");
        WithdrawalRequest savedWithdrawal = withdrawalRepository.save(withdrawal);

        notificationService.notifyUser(new NotificationService.NotificationDraft(
                request.getFarmerId(),
                "SYSTEM_ALERT",
                "Withdrawal request submitted",
                "Your withdrawal request for \"" + project.getTitle() + "\" is waiting for admin review.",
                "/farmer/wallet",
                withdrawalMetadata(project, request.getAmount())
        ));

        notificationService.notifyRole(
                "ADMIN",
                "SYSTEM_ALERT",
                "New withdrawal request",
                savedWithdrawal.getFarmerName() + " requested " + formatAmount(request.getAmount()) + " for \"" + project.getTitle() + "\".",
                "/admin/withdrawal-requests",
                withdrawalMetadata(project, request.getAmount())
        );

        return savedWithdrawal;
    }

    public List<WithdrawalRequest> getAllWithdrawals() {
        return withdrawalRepository.findAllByOrderByDateDesc();
    }

    public List<WithdrawalRequest> getWithdrawalsByStatus(String status) {
        return withdrawalRepository.findByStatusOrderByDateDesc(status.toUpperCase());
    }

    public List<WithdrawalRequest> getProjectWithdrawals(String projectId) {
        return withdrawalRepository.findByProjectIdOrderByDateDesc(projectId);
    }

    public AdvisoryReport createAdvisory(CreateAdvisoryRequest request) {
        AdvisoryReport advisory = new AdvisoryReport();
        advisory.setProjectId(request.getProjectId());
        advisory.setPartnerId(request.getPartnerId());
        advisory.setCreatedBy(request.getCreatedBy());
        advisory.setTitle(request.getTitle());
        advisory.setDescription(request.getDescription());
        advisory.setCreatedAt(request.getCreatedAt());
        return advisoryRepository.save(advisory);
    }

    public List<AdvisoryReport> getProjectAdvisories(String projectId) {
        return advisoryRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public ProjectMilestoneUpdate approveMilestone(String id) {
        ProjectMilestoneUpdate update = updateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone update not found"));
        update.setStatus("VERIFIED");
        ProjectMilestoneUpdate savedUpdate = updateRepository.save(update);
        notifyFarmerMilestoneReview(savedUpdate, "Milestone verified", "Your update was verified by admin.");
        return savedUpdate;
    }

    public ProjectMilestoneUpdate rejectMilestone(String id) {
        ProjectMilestoneUpdate update = updateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone update not found"));
        update.setStatus("REJECTED");
        ProjectMilestoneUpdate savedUpdate = updateRepository.save(update);
        notifyFarmerMilestoneReview(savedUpdate, "Milestone needs changes", "Your update needs changes before it can be accepted.");
        return savedUpdate;
    }

    public WithdrawalRequest approveWithdrawal(String id, String adminRemark) {
        WithdrawalRequest withdrawal = withdrawalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));
        withdrawal.setStatus("DISBURSED");
        withdrawal.setAdminRemark(isBlank(adminRemark) ? "Verified and disbursed by admin." : adminRemark.trim());
        withdrawal.setReviewedAt(Instant.now());
        WithdrawalRequest savedWithdrawal = withdrawalRepository.save(withdrawal);
        Project project = projectRepository.findById(savedWithdrawal.getProjectId()).orElse(null);
        notificationService.notifyUser(new NotificationService.NotificationDraft(
                savedWithdrawal.getFarmerId(),
                "SETTLEMENT_COMPLETED",
                "Withdrawal approved",
                "Your withdrawal of " + formatAmount(savedWithdrawal.getAmount()) + " was approved and disbursed.",
                "/farmer/wallet",
                withdrawalMetadata(project, savedWithdrawal.getAmount())
        ));
        return savedWithdrawal;
    }

    public WithdrawalRequest rejectWithdrawal(String id, String adminRemark) {
        WithdrawalRequest withdrawal = withdrawalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));
        withdrawal.setStatus("REJECTED");
        withdrawal.setAdminRemark(isBlank(adminRemark) ? "Rejected by admin." : adminRemark.trim());
        withdrawal.setReviewedAt(Instant.now());
        WithdrawalRequest savedWithdrawal = withdrawalRepository.save(withdrawal);
        Project project = projectRepository.findById(savedWithdrawal.getProjectId()).orElse(null);
        notificationService.notifyUser(new NotificationService.NotificationDraft(
                savedWithdrawal.getFarmerId(),
                "SYSTEM_ALERT",
                "Withdrawal rejected",
                "Your withdrawal request for " + formatAmount(savedWithdrawal.getAmount()) + " was rejected. Review the admin remark and retry if needed.",
                "/farmer/wallet",
                withdrawalMetadata(project, savedWithdrawal.getAmount())
        ));
        return savedWithdrawal;
    }

    public Map<String, Object> calculateProfit(double revenue, double expenses) {
        double netProfit = Math.max(revenue - expenses, 0);
        double platformCommission = Math.round(netProfit * 0.03);
        double distributableProfit = Math.max(netProfit - platformCommission, 0);
        double investorShare = Math.round(distributableProfit * 0.60);
        double farmerShare = Math.round(distributableProfit * 0.30);
        double partnerShare = Math.round(distributableProfit * 0.10);

        Map<String, Object> result = new HashMap<>();
        result.put("revenue", revenue);
        result.put("expenses", expenses);
        result.put("netProfit", netProfit);
        result.put("platformCommission", platformCommission);
        result.put("distributableProfit", distributableProfit);
        result.put("investorShare", investorShare);
        result.put("farmerShare", farmerShare);
        result.put("partnerShare", partnerShare);
        return result;
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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void notifyFarmerMilestoneReview(ProjectMilestoneUpdate update, String title, String message) {
        Project project = projectRepository.findById(update.getProjectId()).orElse(null);
        notificationService.notifyUser(new NotificationService.NotificationDraft(
                update.getFarmerId(),
                "PROJECT_UPDATE",
                title,
                (project == null ? "Project update" : project.getTitle()) + ": " + message,
                "/farmer/project/" + update.getProjectId(),
                projectMetadata(project)
        ));
    }

    private List<String> investorIds(String projectId) {
        return investmentRepository.findByProjectId(projectId).stream()
                .map(Investment::getInvestorId)
                .distinct()
                .toList();
    }

    private Map<String, Object> projectMetadata(Project project) {
        Map<String, Object> metadata = new HashMap<>();
        if (project != null) {
            metadata.put("projectId", project.getId());
            metadata.put("projectName", project.getTitle());
        }
        return metadata;
    }

    private Map<String, Object> withdrawalMetadata(Project project, double amount) {
        Map<String, Object> metadata = projectMetadata(project);
        metadata.put("amount", amount);
        return metadata;
    }

    private String formatAmount(double amount) {
        return "Rs " + Math.round(amount);
    }
}
