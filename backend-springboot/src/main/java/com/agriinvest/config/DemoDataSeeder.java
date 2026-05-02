package com.agriinvest.config;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.agriinvest.model.Investment;
import com.agriinvest.model.Project;
import com.agriinvest.model.ProjectMilestoneUpdate;
import com.agriinvest.model.User;
import com.agriinvest.model.WalletAccount;
import com.agriinvest.repository.InvestmentRepository;
import com.agriinvest.repository.ProjectMilestoneUpdateRepository;
import com.agriinvest.repository.ProjectRepository;
import com.agriinvest.repository.UserRepository;
import com.agriinvest.repository.WalletAccountRepository;

@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final String DEMO_PASSWORD = "AgriDemo123";
    private static final String DEMO_PROJECT_ID = "demo-completed-vineyard-2026";
    private static final Instant PROJECT_CREATED_AT = Instant.parse("2025-09-03T08:00:00Z");
    private static final Instant PROJECT_COMPLETED_AT = Instant.parse("2026-03-28T17:30:00Z");

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final InvestmentRepository investmentRepository;
    private final WalletAccountRepository walletAccountRepository;
    private final ProjectMilestoneUpdateRepository projectMilestoneUpdateRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository,
                          ProjectRepository projectRepository,
                          InvestmentRepository investmentRepository,
                          WalletAccountRepository walletAccountRepository,
                          ProjectMilestoneUpdateRepository projectMilestoneUpdateRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.investmentRepository = investmentRepository;
        this.walletAccountRepository = walletAccountRepository;
        this.projectMilestoneUpdateRepository = projectMilestoneUpdateRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        User admin = ensureUser("demo_admin_priya", "Priya Sharma", "admin.demo@agriinvest.ai", "9876500001", "ADMIN");
        User farmer = ensureUser("demo_farmer_mahesh", "Mahesh Reddy", "farmer.demo@agriinvest.ai", "9876500002", "FARMER");
        User partner = ensureUser("demo_partner_suresh", "Suresh Gowda", "partner.demo@agriinvest.ai", "9876500003", "AGRI_PARTNER");
        User investorA = ensureUser("demo_investor_ananya", "Ananya Rao", "investor.ananya@agriinvest.ai", "9876500004", "INVESTOR");
        User investorB = ensureUser("demo_investor_karthik", "Karthik Jain", "investor.karthik@agriinvest.ai", "9876500005", "INVESTOR");
        User investorC = ensureUser("demo_investor_meera", "Meera Nair", "investor.meera@agriinvest.ai", "9876500006", "INVESTOR");
        User investorD = ensureUser("demo_investor_arjun", "Arjun Patel", "investor.arjun@agriinvest.ai", "9876500007", "INVESTOR");

        ensureWallet(admin.getId(), 150000.0, 25000.0);
        ensureWallet(farmer.getId(), 450000.0, 123640.0);
        ensureWallet(partner.getId(), 120000.0, 108000.0);
        ensureWallet(investorA.getId(), 300000.0, 43637.65);
        ensureWallet(investorB.getId(), 220000.0, 32728.24);
        ensureWallet(investorC.getId(), 340000.0, 54547.06);
        ensureWallet(investorD.getId(), 360000.0, 54547.05);

        ensureCompletedDemoProject(farmer, partner);
        ensureInvestment("demo-invest-1", investorA.getId(), 200000.0, 43637.65);
        ensureInvestment("demo-invest-2", investorB.getId(), 150000.0, 32728.24);
        ensureInvestment("demo-invest-3", investorC.getId(), 250000.0, 54547.06);
        ensureInvestment("demo-invest-4", investorD.getId(), 250000.0, 54547.05);
        ensureMilestoneUpdate(
                "demo-progress-1",
                "LAND_PREPARATION",
                "Land prepared and drip lines installed",
                "Initial field setup completed with trenching and drip layout.",
                "2025-09-05T09:00:00Z"
        );
        ensureMilestoneUpdate(
                "demo-progress-2",
                "CROP_GROWTH",
                "Canopy development stage",
                "Healthy mid-season crop growth with monitored irrigation schedule.",
                "2025-12-17T11:00:00Z"
        );
        ensureMilestoneUpdate(
                "demo-progress-3",
                "HARVESTING",
                "Harvest and packing completion",
                "Harvest completed and sale invoices verified for settlement.",
                "2026-03-28T15:00:00Z"
        );
    }

    private User ensureUser(String id, String name, String email, String phone, String role) {
        return userRepository.findById(id).orElseGet(() -> {
            User user = new User();
            user.setId(id);
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);
            user.setRole(role);
            user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
            return userRepository.save(user);
        });
    }

    private void ensureWallet(String userId, double principal, double profits) {
        walletAccountRepository.findById(userId).orElseGet(() -> {
            WalletAccount walletAccount = new WalletAccount(userId);
            walletAccount.setPrincipal(principal);
            walletAccount.setProfits(profits);
            walletAccount.setRefunds(0.0);
            walletAccount.setSip(0.0);
            walletAccount.setUpdatedAt(Instant.now());
            return walletAccountRepository.save(walletAccount);
        });
    }

    private void ensureCompletedDemoProject(User farmer, User partner) {
        if (projectRepository.findById(DEMO_PROJECT_ID).isPresent()) {
            return;
        }

        Project project = new Project();
        project.setId(DEMO_PROJECT_ID);
        project.setFarmerId(farmer.getId());
        project.setFarmerName(farmer.getName());
        project.setTitle("Completed Premium Grape Harvest - Nandi Hills Block A");
        project.setCropType("Grapes");
        project.setTargetAmount(850000.0);
        project.setRaisedAmount(850000.0);
        project.setCurrentAmount(850000.0);
        project.setRiskLevel("LOW");
        project.setStatus("COMPLETED");
        project.setAssignedPartnerId(partner.getId());
        project.setAssignedPartnerName(partner.getName());
        project.setMonthlyPartnerSalary(18000.0);
        project.setInvestorCount(4);
        project.setInvestorTotalAmount(850000.0);
        project.setTotalProfitAmount(430000.0);
        project.setPlatformFeeAmount(12900.0);
        project.setPartnerSalaryTotal(108000.0);
        project.setInvestorShareAmount(185460.0);
        project.setFarmerProfitAmount(123640.0);
        project.setDistributableProfitAmount(309100.0);
        project.setCreatedAt(PROJECT_CREATED_AT);
        project.setCompletedAt(PROJECT_COMPLETED_AT);
        project.setAttributes(buildProjectAttributes(partner));
        projectRepository.save(project);
    }

    private Map<String, Object> buildProjectAttributes(User partner) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("title", "Completed Premium Grape Harvest - Nandi Hills Block A");
        attributes.put("description", "A fully completed 6-acre premium grape cultivation project with drip irrigation, field supervision, verified harvest sale, and investor settlement already distributed.");
        attributes.put("location", "Nandi Hills");
        attributes.put("state", "Karnataka");
        attributes.put("cropType", "Grapes");
        attributes.put("acreage", 6);
        attributes.put("fundingGoal", 850000);
        attributes.put("fundedAmount", 850000);
        attributes.put("raisedAmount", 850000);
        attributes.put("fundingPercent", 100);
        attributes.put("timeline", "Sep 2025 - Mar 2026");
        attributes.put("soilType", "Red Loam");
        attributes.put("irrigationType", "Drip Irrigation");
        attributes.put("expectedRevenue", 1280000);
        attributes.put("estimatedExpenses", 850000);
        attributes.put("expectedROI", 23);
        attributes.put("expectedYield", 108);
        attributes.put("esgScore", 84);
        attributes.put("approvalStage", "APPROVED");
        attributes.put("approvalStatus", "APPROVED");
        attributes.put("projectStatus", "COMPLETED");
        attributes.put("status", "COMPLETED");
        attributes.put("progress", 100);
        attributes.put("currentStage", "PROFIT_CALCULATION");
        attributes.put("helperNeeded", true);
        attributes.put("workerRequestStatus", "ASSIGNED");
        attributes.put("helperRequestStatus", "CLOSED");
        attributes.put("monthlySalary", 18000);
        attributes.put("assignedPartnerId", partner.getId());
        attributes.put("assignedPartnerName", partner.getName());
        attributes.put("completionRequested", false);
        attributes.put("investorCount", 4);
        attributes.put("investorTotalAmount", 850000);
        attributes.put("totalProfit", 430000);
        attributes.put("platformFee", 12900);
        attributes.put("totalPartnerSalary", 108000);
        attributes.put("investorPool", 185460);
        attributes.put("farmerShare", 123640);
        attributes.put("needsWaterInvestment", false);
        attributes.put("waterCost", 0);
        attributes.put("waterInvestmentLabel", "Existing water source available");
        attributes.put("images", List.of(
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80"
        ));
        attributes.put("documents", List.of(
                Map.of(
                        "label", "Land Overview Photo",
                        "fileName", "nandi-hills-block-a-overview.jpg",
                        "fileUrl", "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
                        "fileType", "image/jpeg"
                ),
                Map.of(
                        "label", "Cultivation Progress Photo",
                        "fileName", "vine-row-drip-irrigation.jpg",
                        "fileUrl", "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
                        "fileType", "image/jpeg"
                ),
                Map.of(
                        "label", "Harvest Field Verification Photo",
                        "fileName", "harvest-ready-vines.jpg",
                        "fileUrl", "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80",
                        "fileType", "image/jpeg"
                )
        ));
        attributes.put("progressPhotos", List.of(
                Map.of(
                        "id", "demo-progress-1",
                        "title", "Land prepared and drip lines installed",
                        "imageUrl", "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
                        "uploadedAt", "05 Sep 2025",
                        "note", "Initial field setup completed with trenching and drip layout."
                ),
                Map.of(
                        "id", "demo-progress-2",
                        "title", "Canopy development stage",
                        "imageUrl", "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
                        "uploadedAt", "17 Dec 2025",
                        "note", "Healthy mid-season crop growth with monitored irrigation schedule."
                ),
                Map.of(
                        "id", "demo-progress-3",
                        "title", "Harvest and packing completion",
                        "imageUrl", "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=1200&q=80",
                        "uploadedAt", "28 Mar 2026",
                        "note", "Harvest completed and sale invoices verified for settlement."
                )
        ));
        attributes.put("projectInsights", Map.of(
                "cropAnalysis", Map.ofEntries(
                        Map.entry("crop", "Grapes"),
                        Map.entry("cropCode", "grapes"),
                        Map.entry("suitabilityScore", 89),
                        Map.entry("baselineYieldPerAcreQuintal", 18),
                        Map.entry("expectedYield", 108),
                        Map.entry("yieldUnit", "quintal"),
                        Map.entry("referencePricePerQuintal", 11850),
                        Map.entry("costPerAcre", 141667),
                        Map.entry("costEstimate", 850000),
                        Map.entry("revenueEstimate", 1280000),
                        Map.entry("profitEstimate", 430000),
                        Map.entry("riskLevel", "LOW"),
                        Map.entry("waterUsageLevel", "MEDIUM"),
                        Map.entry("recommendedActions", List.of(
                                "Maintain drip irrigation schedule through the final berry sizing stage.",
                                "Continue canopy pruning to sustain airflow and disease control.",
                                "Protect harvest quality with a cool-chain dispatch plan."
                        )),
                        Map.entry("alternativeCrops", List.of(
                                Map.of("crop", "Pomegranate", "cropCode", "pomegranate", "score", 84),
                                Map.of("crop", "Banana", "cropCode", "banana", "score", 80),
                                Map.of("crop", "Tomato", "cropCode", "tomato", "score", 76)
                        ))
                ),
                "waterAnalysis", Map.of(
                        "needsWaterInvestment", false,
                        "waterGapDetected", false,
                        "waterCost", 0,
                        "label", "Existing water source available",
                        "recommendation", "Existing borewell and storage pond supported the completed cycle."
                ),
                "esgBreakdown", Map.of(
                        "environmentalScore", 81,
                        "socialScore", 86,
                        "governanceScore", 85,
                        "finalESGScore", 84,
                        "label", "Excellent"
                )
        ));
        attributes.put("investorSummary", Map.of(
                "projectId", DEMO_PROJECT_ID,
                "projectTitle", "Completed Premium Grape Harvest - Nandi Hills Block A",
                "investorCount", 4,
                "totalInvested", 850000,
                "averageTicket", 212500,
                "investors", List.of(
                        Map.of("investmentId", "demo-invest-1", "investorId", "demo_investor_ananya", "investorName", "Ananya Rao", "amount", 200000, "type", "ONETIME", "paymentMethod", "UPI", "status", "SETTLED", "createdAt", "2025-09-11T10:15:00Z"),
                        Map.of("investmentId", "demo-invest-2", "investorId", "demo_investor_karthik", "investorName", "Karthik Jain", "amount", 150000, "type", "ONETIME", "paymentMethod", "WALLET", "status", "SETTLED", "createdAt", "2025-09-18T12:40:00Z"),
                        Map.of("investmentId", "demo-invest-3", "investorId", "demo_investor_meera", "investorName", "Meera Nair", "amount", 250000, "type", "SIP", "paymentMethod", "SIP", "status", "SETTLED", "createdAt", "2025-10-02T07:45:00Z"),
                        Map.of("investmentId", "demo-invest-4", "investorId", "demo_investor_arjun", "investorName", "Arjun Patel", "amount", 250000, "type", "ONETIME", "paymentMethod", "WALLET", "status", "SETTLED", "createdAt", "2025-10-10T16:05:00Z")
                )
        ));
        attributes.put("tags", List.of("Completed", "Grapes", "Verified Harvest", "Low Risk", "Drip Irrigation"));
        return attributes;
    }

    private void ensureInvestment(String id, String investorId, double amount, double profit) {
        if (investmentRepository.findById(id).isPresent()) {
            return;
        }

        Investment investment = new Investment();
        investment.setId(id);
        investment.setInvestorId(investorId);
        investment.setProjectId(DEMO_PROJECT_ID);
        investment.setAmount(amount);
        investment.setPaymentMethod("UPI");
        investment.setCropType("Grapes");
        investment.setStatus("SETTLED");
        investment.setExpectedReturn(18.0);
        investment.setExpectedRoi(18.0);
        investment.setActualRoi(Math.round(((profit / amount) * 100.0) * 100.0) / 100.0);
        investment.setProfit(profit);
        investment.setCreatedAt(PROJECT_CREATED_AT.plusSeconds(86400));
        investmentRepository.save(investment);
    }

    private void ensureMilestoneUpdate(String id, String milestoneKey, String title, String notes, String createdAt) {
        if (projectMilestoneUpdateRepository.findById(id).isPresent()) {
            return;
        }

        ProjectMilestoneUpdate update = new ProjectMilestoneUpdate();
        update.setId(id);
        update.setProjectId(DEMO_PROJECT_ID);
        update.setFarmerId("demo_farmer_mahesh");
        update.setMilestoneKey(milestoneKey);
        update.setTitle(title);
        update.setNotes(notes);
        update.setDate(createdAt);
        update.setCreatedAt(createdAt);
        update.setCropHealth("GOOD");
        update.setProofName(title.toLowerCase().replace(' ', '-') + ".jpg");
        update.setProofImage("");
        update.setStatus("VERIFIED");
        projectMilestoneUpdateRepository.save(update);
    }
}
