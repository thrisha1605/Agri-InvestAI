package com.agriinvest.service;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.agriinvest.model.Investment;
import com.agriinvest.model.Milestone;
import com.agriinvest.model.Project;
import com.agriinvest.model.User;
import com.agriinvest.repository.InvestmentRepository;
import com.agriinvest.repository.ProjectRepository;
import com.agriinvest.repository.UserRepository;

import jakarta.validation.ValidationException;

@Service
public class ProjectService {

    public record PartnerPayoutInput(String partnerId, String partnerName, double monthlySalary) {
    }

    private record SettlementSnapshot(Project project,
                                      List<Investment> investments,
                                      List<PartnerPayoutInput> partners,
                                      int monthsWorked,
                                      int investorCount,
                                      double totalInvested,
                                      double totalProfit,
                                      double platformFee,
                                      double totalPartnerSalary,
                                      double distributableProfit,
                                      double investorPool,
                                      double farmerShare) {
    }

    private final ProjectRepository projectRepository;
    private final InvestmentRepository investmentRepository;
    private final WalletService walletService;
    private final ProjectInsightService projectInsightService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ProjectService(ProjectRepository projectRepository,
                          InvestmentRepository investmentRepository,
                          WalletService walletService,
                          ProjectInsightService projectInsightService,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.projectRepository = projectRepository;
        this.investmentRepository = investmentRepository;
        this.walletService = walletService;
        this.projectInsightService = projectInsightService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<Project> allProjects() {
        return projectRepository.findAll();
    }

    public List<Project> findProjectsByFarmer(String farmerId) {
        return projectRepository.findByFarmerId(farmerId);
    }

    public Project getProjectById(String projectId) {
        return getProject(projectId);
    }

    public Project createProject(String farmerId, String title, String cropType, double targetAmount, String riskLevel) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", title);
        payload.put("cropType", cropType);
        payload.put("targetAmount", targetAmount);
        payload.put("fundingGoal", targetAmount);
        payload.put("riskLevel", riskLevel);
        payload.put("status", "PENDING");
        payload.put("approvalStage", "SENT_FOR_APPROVAL");
        payload.put("approvalStatus", "PENDING");
        payload.put("projectStatus", "NOT_STARTED");
        payload.put("fundedAmount", 0.0);
        payload.put("raisedAmount", 0.0);
        return createProjectFromPayload(farmerId, payload);
    }

    public Project createProjectFromPayload(String farmerId, Map<String, Object> payload) {
        Project project = new Project();
        project.setFarmerId(farmerId);
        project.setCreatedAt(Instant.now());
        project.setRaisedAmount(0.0);
        project.setCurrentAmount(0.0);
        applyPayload(project, enrichPayload(null, payload));

        if (project.getStatus() == null || project.getStatus().isBlank()) {
            project.setStatus("PENDING");
        }

        if (!project.getAttributes().containsKey("approvalStage")) {
            putAttribute(project, "approvalStage", "SENT_FOR_APPROVAL");
        }
        if (!project.getAttributes().containsKey("approvalStatus")) {
            putAttribute(project, "approvalStatus", "PENDING");
        }
        if (!project.getAttributes().containsKey("projectStatus")) {
            putAttribute(project, "projectStatus", "NOT_STARTED");
        }

        if (project.getFarmerName() == null || project.getFarmerName().isBlank()) {
            userRepository.findById(farmerId)
                    .map(User::getName)
                    .filter(name -> name != null && !name.isBlank())
                    .ifPresent(project::setFarmerName);
        }

        Project savedProject = projectRepository.save(project);
        String farmerName = resolveUserName(savedProject.getFarmerId(), savedProject.getFarmerName());

        notificationService.notifyUser(new NotificationService.NotificationDraft(
                savedProject.getFarmerId(),
                "PROJECT_SUBMITTED",
                "Project submitted for review",
                "Your \"" + savedProject.getTitle() + "\" project is now waiting for admin approval.",
                "/farmer/projects",
                projectMetadata(savedProject)
        ));

        notificationService.notifyRole(
                "ADMIN",
                "NEW_PROJECT_SUBMITTED",
                "New project awaiting approval",
                farmerName + " submitted \"" + savedProject.getTitle() + "\" for review.",
                "/admin/projects",
                projectMetadata(savedProject)
        );

        return savedProject;
    }

    public Project updateProject(String projectId, Map<String, Object> updates) {
        Project project = getProject(projectId);
        applyPayload(project, enrichPayload(project, updates));
        return projectRepository.save(project);
    }

    public Project approveProject(String id) {
        Project project = getProject(id);

        if ("APPROVED".equals(project.getStatus())) {
            return project;
        }

        project.setStatus("APPROVED");
        putAttribute(project, "status", "APPROVED");
        putAttribute(project, "approvalStage", "APPROVED");
        putAttribute(project, "approvalStatus", "APPROVED");
        if (!project.getAttributes().containsKey("projectStatus")
                || String.valueOf(project.getAttributes().get("projectStatus")).isBlank()
                || "NOT_STARTED".equals(String.valueOf(project.getAttributes().get("projectStatus")))) {
            putAttribute(project, "projectStatus", "OPEN_FOR_FUNDING");
        }

        Project savedProject = projectRepository.save(project);
        notificationService.notifyUser(new NotificationService.NotificationDraft(
                savedProject.getFarmerId(),
                "PROJECT_APPROVED",
                "Project approved",
                "Your \"" + savedProject.getTitle() + "\" project is approved and ready for funding.",
                "/projects/" + savedProject.getId(),
                projectMetadata(savedProject)
        ));
        return savedProject;
    }

    public Project rejectProject(String id) {
        Project project = getProject(id);

        if ("REJECTED".equals(project.getStatus())) {
            return project;
        }

        project.setStatus("REJECTED");
        putAttribute(project, "status", "REJECTED");
        putAttribute(project, "approvalStage", "REJECTED");
        putAttribute(project, "approvalStatus", "REJECTED");
        Project savedProject = projectRepository.save(project);
        notificationService.notifyUser(new NotificationService.NotificationDraft(
                savedProject.getFarmerId(),
                "PROJECT_REJECTED",
                "Project needs changes",
                "Your \"" + savedProject.getTitle() + "\" project was not approved yet. Review the admin feedback and update it.",
                "/farmer/projects",
                projectMetadata(savedProject)
        ));
        return savedProject;
    }

    public List<Milestone> getMilestones(String projectId) {
        return new ArrayList<>();
    }

    public Milestone addMilestone(String projectId, String title, String desc, String date) {
        Milestone milestone = new Milestone();
        milestone.setProjectId(projectId);
        milestone.setTitle(title);
        milestone.setDescription(desc);
        milestone.setStatus("PENDING");
        milestone.setCreatedAt(Instant.now());

        return milestone;
    }

    public Map<String, Object> investmentSummary(String projectId) {
        Project project = getProject(projectId);
        List<Investment> investments = investmentRepository.findByProjectId(projectId);
        double totalInvested = investments.stream().mapToDouble(Investment::getAmount).sum();

        List<Map<String, Object>> investors = investments.stream()
                .map(item -> Map.<String, Object>of(
                        "investmentId", item.getId(),
                        "investorId", item.getInvestorId(),
                        "investorName", resolveInvestorName(item.getInvestorId()),
                        "amount", item.getAmount(),
                        "type", "SIP".equalsIgnoreCase(item.getPaymentMethod()) ? "SIP" : "ONETIME",
                        "paymentMethod", item.getPaymentMethod(),
                        "status", item.getStatus(),
                        "createdAt", item.getCreatedAt()
                ))
                .toList();

        return Map.of(
                "projectId", project.getId(),
                "projectTitle", project.getTitle(),
                "investorCount", investments.size(),
                "totalInvested", totalInvested,
                "averageTicket", investments.isEmpty() ? 0.0 : totalInvested / investments.size(),
                "investors", investors
        );
    }

    public Map<String, Object> settlementPreview(String projectId,
                                                 double totalProfit,
                                                 Integer monthsWorked,
                                                 List<PartnerPayoutInput> partnerInputs) {
        SettlementSnapshot snapshot = buildSettlement(projectId, totalProfit, monthsWorked, partnerInputs);
        return toSettlementResponse(snapshot);
    }

    public Map<String, Object> completeProject(String projectId,
                                               double totalProfit,
                                               Integer monthsWorked,
                                               List<PartnerPayoutInput> partnerInputs) {
        SettlementSnapshot snapshot = buildSettlement(projectId, totalProfit, monthsWorked, partnerInputs);

        distributeInvestorPayouts(snapshot);
        distributePartnerSalaries(snapshot);

        if (snapshot.farmerShare() > 0) {
            walletService.creditProfit(
                    snapshot.project().getFarmerId(),
                    snapshot.farmerShare(),
                    "farmer_profit_" + snapshot.project().getId(),
                    "Farmer profit credited after completing " + snapshot.project().getTitle()
            );
        }

        Project project = snapshot.project();
        project.setStatus("COMPLETED");
        project.setCompletedAt(Instant.now());
        project.setInvestorCount(snapshot.investorCount());
        project.setInvestorTotalAmount(snapshot.totalInvested());
        project.setTotalProfitAmount(snapshot.totalProfit());
        project.setPlatformFeeAmount(snapshot.platformFee());
        project.setPartnerSalaryTotal(snapshot.totalPartnerSalary());
        project.setInvestorShareAmount(snapshot.investorPool());
        project.setFarmerProfitAmount(snapshot.farmerShare());
        project.setDistributableProfitAmount(snapshot.distributableProfit());

        putAttribute(project, "status", "COMPLETED");
        putAttribute(project, "projectStatus", "COMPLETED");
        putAttribute(project, "completionRequested", false);
        putAttribute(project, "totalProfit", snapshot.totalProfit());
        putAttribute(project, "platformFee", snapshot.platformFee());
        putAttribute(project, "totalPartnerSalary", snapshot.totalPartnerSalary());
        putAttribute(project, "investorPool", snapshot.investorPool());
        putAttribute(project, "farmerShare", snapshot.farmerShare());
        putAttribute(project, "investorCount", snapshot.investorCount());
        putAttribute(project, "fundedAmount", snapshot.totalInvested());
        putAttribute(project, "raisedAmount", snapshot.totalInvested());

        if (!snapshot.partners().isEmpty()) {
            PartnerPayoutInput leadPartner = snapshot.partners().get(0);
            project.setAssignedPartnerId(leadPartner.partnerId());
            project.setAssignedPartnerName(leadPartner.partnerName());
            project.setMonthlyPartnerSalary(leadPartner.monthlySalary());
            putAttribute(project, "assignedPartnerId", leadPartner.partnerId());
            putAttribute(project, "assignedPartnerName", leadPartner.partnerName());
            putAttribute(project, "monthlySalary", leadPartner.monthlySalary());
            putAttribute(project, "workerRequestStatus", "ASSIGNED");
            putAttribute(project, "helperRequestStatus", "CLOSED");
        }

        projectRepository.save(project);

        notificationService.notifyUser(new NotificationService.NotificationDraft(
                project.getFarmerId(),
                "SETTLEMENT_COMPLETED",
                "Project settlement completed",
                "Settlement for \"" + project.getTitle() + "\" is complete. Farmer share: " + formatAmount(snapshot.farmerShare()) + ".",
                "/farmer/wallet",
                settlementMetadata(project, snapshot.farmerShare())
        ));

        for (Investment investment : snapshot.investments()) {
            if (investment.getProfit() > 0) {
                notificationService.notifyUser(new NotificationService.NotificationDraft(
                        investment.getInvestorId(),
                        "PROFIT_DISTRIBUTED",
                        "Profit credited",
                        "Your return of " + formatAmount(investment.getProfit()) + " from \"" + project.getTitle() + "\" has been credited.",
                        "/investor/wallet",
                        settlementMetadata(project, investment.getProfit())
                ));
            } else {
                notificationService.notifyUser(new NotificationService.NotificationDraft(
                        investment.getInvestorId(),
                        "PROJECT_UPDATE",
                        "Project completed",
                        "\"" + project.getTitle() + "\" has been completed and settled.",
                        "/investor/my-projects",
                        projectMetadata(project)
                ));
            }
        }

        for (PartnerPayoutInput partner : snapshot.partners()) {
            double totalSalary = roundMoney(Math.max(partner.monthlySalary(), 0.0) * snapshot.monthsWorked());
            if (totalSalary <= 0) {
                continue;
            }

            notificationService.notifyUser(new NotificationService.NotificationDraft(
                    partner.partnerId(),
                    "SALARY_RELEASED",
                    "Partner payout released",
                    "Your payout of " + formatAmount(totalSalary) + " for \"" + project.getTitle() + "\" has been released.",
                    "/partner/wallet",
                    settlementMetadata(project, totalSalary)
            ));
        }

        Map<String, Object> response = new LinkedHashMap<>(toSettlementResponse(snapshot));
        response.put("status", "COMPLETED");
        response.put("message", "Project completed and payouts credited to stakeholder wallets");
        return response;
    }

    private SettlementSnapshot buildSettlement(String projectId,
                                               double totalProfit,
                                               Integer monthsWorked,
                                               List<PartnerPayoutInput> partnerInputs) {
        if (totalProfit < 0) {
            throw new ValidationException("Total profit cannot be negative");
        }

        Project project = getProject(projectId);
        List<Investment> investments = investmentRepository.findByProjectId(projectId);
        List<PartnerPayoutInput> partners = normalizePartners(project, partnerInputs);
        int normalizedMonthsWorked = monthsWorked == null || monthsWorked < 1 ? 1 : monthsWorked;
        int investorCount = investments.size();
        double totalInvested = investments.stream().mapToDouble(Investment::getAmount).sum();
        double platformFee = roundMoney(totalProfit * 0.03);
        double totalPartnerSalary = roundMoney(
                partners.stream()
                        .mapToDouble(partner -> Math.max(partner.monthlySalary(), 0.0) * normalizedMonthsWorked)
                        .sum()
        );
        double distributableProfit = roundMoney(Math.max(totalProfit - platformFee - totalPartnerSalary, 0.0));
        double investorPool = roundMoney(distributableProfit * 0.6);
        double farmerShare = roundMoney(Math.max(distributableProfit - investorPool, 0.0));

        return new SettlementSnapshot(
                project,
                investments,
                partners,
                normalizedMonthsWorked,
                investorCount,
                totalInvested,
                roundMoney(totalProfit),
                platformFee,
                totalPartnerSalary,
                distributableProfit,
                investorPool,
                farmerShare
        );
    }

    private List<PartnerPayoutInput> normalizePartners(Project project, List<PartnerPayoutInput> partnerInputs) {
        if (partnerInputs != null && !partnerInputs.isEmpty()) {
            return partnerInputs.stream()
                    .filter(partner -> partner.partnerId() != null && !partner.partnerId().isBlank())
                    .toList();
        }

        if (project.getAssignedPartnerId() != null
                && !project.getAssignedPartnerId().isBlank()
                && project.getMonthlyPartnerSalary() > 0) {
            return List.of(new PartnerPayoutInput(
                    project.getAssignedPartnerId(),
                    project.getAssignedPartnerName(),
                    project.getMonthlyPartnerSalary()
            ));
        }

        return List.of();
    }

    private void distributeInvestorPayouts(SettlementSnapshot snapshot) {
        double distributed = 0.0;

        for (int index = 0; index < snapshot.investments().size(); index++) {
            Investment investment = snapshot.investments().get(index);
            double share = index == snapshot.investments().size() - 1
                    ? roundMoney(Math.max(snapshot.investorPool() - distributed, 0.0))
                    : snapshot.totalInvested() <= 0
                        ? 0.0
                        : roundMoney((snapshot.investorPool() * investment.getAmount()) / snapshot.totalInvested());

            investment.setProfit(share);
            investment.setActualRoi(investment.getAmount() <= 0 ? 0.0 : roundMoney((share / investment.getAmount()) * 100));
            investment.setStatus("SETTLED");
            investmentRepository.save(investment);

            if (share > 0) {
                walletService.creditProfit(
                        investment.getInvestorId(),
                        share,
                        "investor_return_" + investment.getId(),
                        "Investor ROI credited after completing " + snapshot.project().getTitle()
                );
            }

            distributed += share;
        }
    }

    private void distributePartnerSalaries(SettlementSnapshot snapshot) {
        for (PartnerPayoutInput partner : snapshot.partners()) {
            double monthlySalary = Math.max(partner.monthlySalary(), 0.0);
            if (monthlySalary <= 0) {
                continue;
            }

            for (int month = 1; month <= snapshot.monthsWorked(); month++) {
                walletService.creditSalary(
                        partner.partnerId(),
                        monthlySalary,
                        "partner_salary_" + snapshot.project().getId() + "_" + partner.partnerId() + "_" + month,
                        "Month " + month + " salary credited for " + snapshot.project().getTitle()
                );
            }
        }
    }

    private Map<String, Object> toSettlementResponse(SettlementSnapshot snapshot) {
        List<Map<String, Object>> partnerSummary = snapshot.partners().stream()
                .map(partner -> Map.<String, Object>of(
                        "partnerId", partner.partnerId(),
                        "partnerName", partner.partnerName() == null ? "" : partner.partnerName(),
                        "monthlySalary", roundMoney(Math.max(partner.monthlySalary(), 0.0)),
                        "monthsWorked", snapshot.monthsWorked(),
                        "totalSalary", roundMoney(Math.max(partner.monthlySalary(), 0.0) * snapshot.monthsWorked())
                ))
                .toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("projectId", snapshot.project().getId());
        result.put("projectTitle", snapshot.project().getTitle());
        result.put("investorCount", snapshot.investorCount());
        result.put("totalInvested", snapshot.totalInvested());
        result.put("totalProfit", snapshot.totalProfit());
        result.put("platformFee", snapshot.platformFee());
        result.put("totalPartnerSalary", snapshot.totalPartnerSalary());
        result.put("distributableProfit", snapshot.distributableProfit());
        result.put("investorPool", snapshot.investorPool());
        result.put("farmerShare", snapshot.farmerShare());
        result.put("monthsWorked", snapshot.monthsWorked());
        result.put("partners", partnerSummary);
        result.put("investors", investmentSummary(snapshot.project().getId()).get("investors"));
        return result;
    }

    private void applyPayload(Project project, Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return;
        }

        Map<String, Object> mergedAttributes = new LinkedHashMap<>(project.getAttributes());
        mergedAttributes.putAll(payload);
        project.setAttributes(mergedAttributes);

        String title = firstString(payload, "title");
        if (title != null) {
            project.setTitle(title);
        }

        String cropType = firstString(payload, "cropType");
        if (cropType != null) {
            project.setCropType(cropType);
        }

        String farmerName = firstString(payload, "farmerName");
        if (farmerName != null) {
            project.setFarmerName(farmerName);
        }

        Double targetAmount = firstNumber(payload, "targetAmount", "fundingGoal");
        if (targetAmount != null) {
            project.setTargetAmount(targetAmount);
        }

        Double raisedAmount = firstNumber(payload, "raisedAmount", "fundedAmount", "investorTotalAmount");
        if (raisedAmount != null) {
            project.setRaisedAmount(raisedAmount);
        }

        Double currentAmount = firstNumber(payload, "currentAmount");
        if (currentAmount != null) {
            project.setCurrentAmount(currentAmount);
        }

        String riskLevel = firstString(payload, "riskLevel");
        if (riskLevel != null) {
            project.setRiskLevel(riskLevel);
        }

        String assignedPartnerId = firstString(payload, "assignedPartnerId");
        if (assignedPartnerId != null) {
            project.setAssignedPartnerId(assignedPartnerId);
        }

        String assignedPartnerName = firstString(payload, "assignedPartnerName");
        if (assignedPartnerName != null) {
            project.setAssignedPartnerName(assignedPartnerName);
        }

        Double monthlySalary = firstNumber(payload, "monthlyPartnerSalary", "monthlySalary");
        if (monthlySalary != null) {
            project.setMonthlyPartnerSalary(monthlySalary);
        }

        Double investorCount = firstNumber(payload, "investorCount");
        if (investorCount != null) {
            project.setInvestorCount(investorCount.intValue());
        }

        Double investorTotalAmount = firstNumber(payload, "investorTotalAmount");
        if (investorTotalAmount != null) {
            project.setInvestorTotalAmount(investorTotalAmount);
        }

        Double totalProfitAmount = firstNumber(payload, "totalProfitAmount", "totalProfit");
        if (totalProfitAmount != null) {
            project.setTotalProfitAmount(totalProfitAmount);
        }

        Double platformFeeAmount = firstNumber(payload, "platformFeeAmount", "platformFee");
        if (platformFeeAmount != null) {
            project.setPlatformFeeAmount(platformFeeAmount);
        }

        Double partnerSalaryTotal = firstNumber(payload, "partnerSalaryTotal", "totalPartnerSalary");
        if (partnerSalaryTotal != null) {
            project.setPartnerSalaryTotal(partnerSalaryTotal);
        }

        Double investorShareAmount = firstNumber(payload, "investorShareAmount", "investorPool");
        if (investorShareAmount != null) {
            project.setInvestorShareAmount(investorShareAmount);
        }

        Double farmerProfitAmount = firstNumber(payload, "farmerProfitAmount", "farmerShare");
        if (farmerProfitAmount != null) {
            project.setFarmerProfitAmount(farmerProfitAmount);
        }

        Double distributableProfitAmount = firstNumber(payload, "distributableProfitAmount", "distributableProfit");
        if (distributableProfitAmount != null) {
            project.setDistributableProfitAmount(distributableProfitAmount);
        }

        String status = firstString(payload, "status");
        if (status != null) {
            project.setStatus(status);
        }
    }

    private Map<String, Object> enrichPayload(Project existingProject, Map<String, Object> payload) {
        if (!projectInsightService.shouldRefreshInsights(payload)) {
            return payload;
        }

        Map<String, Object> merged = new LinkedHashMap<>();
        if (existingProject != null) {
            merged.putAll(existingProject.getAttributes());
        }
        merged.putAll(payload);
        merged.putAll(projectInsightService.buildProjectInsights(merged));
        return merged;
    }

    private Project getProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private void putAttribute(Project project, String key, Object value) {
        Map<String, Object> attributes = new LinkedHashMap<>(project.getAttributes());
        attributes.put(key, value);
        project.setAttributes(attributes);
    }

    private String firstString(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }

            String text = String.valueOf(value).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }

        return null;
    }

    private Double firstNumber(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }

            if (value instanceof Number number) {
                return number.doubleValue();
            }

            try {
                String text = String.valueOf(value).trim();
                if (!text.isEmpty()) {
                    return Double.parseDouble(text);
                }
            } catch (NumberFormatException exception) {
                // Ignore invalid numeric values and continue to the next fallback key.
            }
        }

        return null;
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String resolveInvestorName(String investorId) {
        return userRepository.findById(investorId)
                .map(User::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(investorId);
    }

    private String resolveUserName(String userId, String fallback) {
        return userRepository.findById(userId)
                .map(User::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(fallback == null || fallback.isBlank() ? userId : fallback);
    }

    private Map<String, Object> projectMetadata(Project project) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("projectId", project.getId());
        metadata.put("projectName", project.getTitle());
        metadata.put("cropType", project.getCropType());
        return metadata;
    }

    private Map<String, Object> settlementMetadata(Project project, double amount) {
        Map<String, Object> metadata = projectMetadata(project);
        metadata.put("amount", roundMoney(amount));
        return metadata;
    }

    private String formatAmount(double amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        formatter.setMaximumFractionDigits(0);
        return "Rs " + formatter.format(Math.round(amount));
    }
}
