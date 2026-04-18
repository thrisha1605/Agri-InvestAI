package com.agriinvest.store;

import com.agriinvest.model.Investment;
import com.agriinvest.model.Milestone;
import com.agriinvest.model.Project;
import com.agriinvest.model.User;
import com.agriinvest.model.Wallet;
import com.agriinvest.model.WalletTransaction;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class InMemoryStore {
    public final Map<String, User> users = new ConcurrentHashMap<>();
    public final Map<String, String> otpCodes = new ConcurrentHashMap<>();
    public final Map<String, String> otpTargets = new ConcurrentHashMap<>();
    public final Map<String, Wallet> wallets = new ConcurrentHashMap<>();
    public final Map<String, Project> projects = new ConcurrentHashMap<>();
    public final Map<String, Investment> investments = new ConcurrentHashMap<>();
    public final Map<String, List<Milestone>> milestones = new ConcurrentHashMap<>();
    public final Map<String, List<WalletTransaction>> walletTransactions = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        User admin = new User(UUID.randomUUID().toString(), "Admin", "admin@agriinvest.ai", "9876543210", "Admin12", "ADMIN");
        User farmer = new User(UUID.randomUUID().toString(), "Farmer Demo", "farmer@agriinvest.ai", "9876543211", "Farmer12", "FARMER");
        User investor = new User(UUID.randomUUID().toString(), "Investor Demo", "investor@agriinvest.ai", "9876543212", "Investor12", "INVESTOR");
        User partner = new User(UUID.randomUUID().toString(), "Agri Partner", "partner@agriinvest.ai", "9876543213", "Partner12", "AGRI_PARTNER");
        for (User user : List.of(admin, farmer, investor, partner)) {
            users.put(user.getId(), user);
            wallets.put(user.getId(), new Wallet(user.getId(), 50000.0, 2500.0, 0.0, 1000.0));
            walletTransactions.put(user.getId(), new ArrayList<>());
        }
        Project p = new Project(UUID.randomUUID().toString(), farmer.getId(), "Tomato Smart Farming", "Tomato", 200000.0, 50000.0, "MEDIUM", "LIVE", Instant.now());
        projects.put(p.getId(), p);
        milestones.put(p.getId(), new ArrayList<>(List.of(
                new Milestone(UUID.randomUUID().toString(), p.getId(), "Planting", "COMPLETED", "Seeds planted", Instant.now()),
                new Milestone(UUID.randomUUID().toString(), p.getId(), "Irrigation", "PENDING", "Scheduled next week", Instant.now())
        )));
    }
}
