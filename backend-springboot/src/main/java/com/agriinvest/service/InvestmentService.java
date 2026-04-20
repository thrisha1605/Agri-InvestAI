package com.agriinvest.service;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.agriinvest.model.Investment;
import com.agriinvest.model.Project;
import com.agriinvest.model.User;
import com.agriinvest.repository.InvestmentRepository;
import com.agriinvest.repository.ProjectRepository;
import com.agriinvest.repository.UserRepository;

import jakarta.validation.ValidationException;

@Service
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final ProjectRepository projectRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public InvestmentService(InvestmentRepository investmentRepository,
                             ProjectRepository projectRepository,
                             WalletService walletService,
                             NotificationService notificationService,
                             UserRepository userRepository) {
        this.investmentRepository = investmentRepository;
        this.projectRepository = projectRepository;
        this.walletService = walletService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public Map<String, Object> invest(String investorId, String projectId, double amount, String paymentMethod) {
        Project project = projectRepository.findById(projectId).orElseThrow(
                () -> new ValidationException("Project not found")
        );

        if (amount <= 0) {
            throw new ValidationException("Investment amount must be greater than 0");
        }

        String normalizedPaymentMethod = paymentMethod == null || paymentMethod.isBlank()
                ? "UPI"
                : paymentMethod.trim().toUpperCase();

        Investment investment = new Investment();
        investment.setId(UUID.randomUUID().toString());
        investment.setInvestorId(investorId);
        investment.setProjectId(projectId);
        investment.setAmount(amount);
        investment.setPaymentMethod(normalizedPaymentMethod);
        investment.setCropType(project.getCropType());
        investment.setStatus("ACTIVE");
        investment.setExpectedReturn(18.0);
        investment.setProfit(0.0);
        investment.setExpectedRoi(project.getTargetAmount() <= 0
                ? 0.0
                : Math.round((investment.getExpectedReturn() / amount) * 10000.0) / 100.0);
        investment.setCreatedAt(Instant.now());

        if ("WALLET".equalsIgnoreCase(normalizedPaymentMethod)) {
            walletService.debitForInvestment(
                    investorId,
                    amount,
                    investment.getId(),
                    "Investment in " + project.getTitle()
            );
        }

        project.setRaisedAmount(project.getRaisedAmount() + amount);

        if (project.getRaisedAmount() >= project.getTargetAmount()) {
            project.setStatus("FUNDED");
        } else {
            project.setStatus("LIVE");
        }

        List<Investment> existingInvestments = investmentRepository.findByProjectId(projectId);
        project.setInvestorCount(existingInvestments.size() + 1);
        project.setInvestorTotalAmount(project.getRaisedAmount());
        Map<String, Object> attributes = new LinkedHashMap<>(project.getAttributes());
        attributes.put("status", project.getStatus());
        attributes.put("projectStatus", project.getRaisedAmount() >= project.getTargetAmount() ? "READY_TO_START" : "OPEN_FOR_FUNDING");
        attributes.put("fundedAmount", project.getRaisedAmount());
        attributes.put("raisedAmount", project.getRaisedAmount());
        attributes.put("investorCount", project.getInvestorCount());
        attributes.put("investorTotalAmount", project.getInvestorTotalAmount());
        attributes.put("fundingPercent", project.getTargetAmount() <= 0
                ? 0
                : Math.round((project.getRaisedAmount() / project.getTargetAmount()) * 100));
        project.setAttributes(attributes);

        projectRepository.save(project);
        investmentRepository.save(investment);

        String investorName = userRepository.findById(investorId)
                .map(User::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse("An investor");

        notificationService.notifyUser(new NotificationService.NotificationDraft(
                investorId,
                "PAYMENT_CONFIRMED",
                "Investment confirmed",
                "Your investment of " + formatAmount(amount) + " in \"" + project.getTitle() + "\" is confirmed.",
                "/investor/my-projects",
                investmentMetadata(project, amount, investorName)
        ));

        notificationService.notifyUser(new NotificationService.NotificationDraft(
                project.getFarmerId(),
                "NEW_INVESTMENT",
                "New investment received",
                investorName + " invested " + formatAmount(amount) + " in \"" + project.getTitle() + "\".",
                "/projects/" + project.getId(),
                investmentMetadata(project, amount, investorName)
        ));

        if ("FUNDED".equalsIgnoreCase(project.getStatus())) {
            List<String> investorIds = investmentRepository.findByProjectId(projectId).stream()
                    .map(Investment::getInvestorId)
                    .distinct()
                    .toList();

            notificationService.notifyUser(new NotificationService.NotificationDraft(
                    project.getFarmerId(),
                    "PROJECT_FUNDED",
                    "Project fully funded",
                    "\"" + project.getTitle() + "\" has reached its funding goal.",
                    "/projects/" + project.getId(),
                    projectFundingMetadata(project)
            ));

            notificationService.notifyUsers(
                    investorIds,
                    "PROJECT_FUNDED",
                    "Project fully funded",
                    "\"" + project.getTitle() + "\" reached its funding goal and is ready for the next stage.",
                    "/projects/" + project.getId(),
                    projectFundingMetadata(project)
            );
        }

        return Map.of(
                "message", "Payment successful",
                "investmentId", investment.getId(),
                "projectStatus", project.getStatus(),
                "paymentMethod", normalizedPaymentMethod
        );
    }

    public List<Investment> myInvestments(String investorId) {
        return investmentRepository.findByInvestorId(investorId);
    }

    private Map<String, Object> investmentMetadata(Project project, double amount, String investorName) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("projectId", project.getId());
        metadata.put("projectName", project.getTitle());
        metadata.put("amount", amount);
        metadata.put("investorName", investorName);
        return metadata;
    }

    private Map<String, Object> projectFundingMetadata(Project project) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("projectId", project.getId());
        metadata.put("projectName", project.getTitle());
        metadata.put("amount", project.getRaisedAmount());
        return metadata;
    }

    private String formatAmount(double amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        formatter.setMaximumFractionDigits(0);
        return "Rs " + formatter.format(Math.round(amount));
    }
}
