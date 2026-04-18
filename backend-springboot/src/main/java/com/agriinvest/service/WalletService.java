package com.agriinvest.service;

import com.agriinvest.model.WalletAccount;
import com.agriinvest.model.Wallet;
import com.agriinvest.model.WalletTransaction;
import com.agriinvest.model.WalletTransactionRecord;
import com.agriinvest.repository.WalletAccountRepository;
import com.agriinvest.repository.WalletTransactionRepository;
import jakarta.validation.ValidationException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class WalletService {
    private static final Pattern IFSC = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private final WalletAccountRepository walletAccountRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    public WalletService(WalletAccountRepository walletAccountRepository,
                         WalletTransactionRepository walletTransactionRepository) {
        this.walletAccountRepository = walletAccountRepository;
        this.walletTransactionRepository = walletTransactionRepository;
    }

    public Wallet getWallet(String userId) {
        return toWallet(getOrCreateWallet(userId));
    }

    public List<WalletTransaction> transactions(String userId) {
        return walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toWalletTransaction)
                .toList();
    }

    public Map<String, Object> addMoney(String userId, double amount) {
        if (amount <= 0) throw new ValidationException("Amount must be greater than 0");
        WalletAccount wallet = getOrCreateWallet(userId);
        wallet.setPrincipal(wallet.getPrincipal() + amount);
        saveWallet(wallet);

        WalletTransactionRecord txn = createTransaction(
                userId,
                "ADD_MONEY",
                amount,
                "COMPLETED",
                "Wallet top-up successful",
                null,
                null,
                null
        );

        return Map.of("message", "Payment successful", "transactionId", txn.getId(), "balance", wallet.getBalance());
    }

    public Map<String, Object> withdraw(String userId,
                                        double amount,
                                        String payoutMethod,
                                        String payoutDestination,
                                        String holderName,
                                        String accountNumber,
                                        String ifsc) {
        if (amount <= 0) {
            throw new ValidationException("Amount must be greater than 0");
        }

        String normalizedMethod = normalizePayoutMethod(payoutMethod);
        String normalizedDestination = payoutDestination == null ? "" : payoutDestination.trim();
        String normalizedHolderName = holderName == null ? "" : holderName.trim();
        String normalizedAccountNumber = accountNumber == null ? "" : accountNumber.trim();
        String normalizedIfsc = ifsc == null ? "" : ifsc.trim().toUpperCase();

        if ("BANK_ACCOUNT".equals(normalizedMethod)) {
            if (normalizedHolderName.isBlank() || normalizedAccountNumber.isBlank()) {
                throw new ValidationException("Account holder name and account number are required");
            }

            if (!IFSC.matcher(normalizedIfsc).matches()) {
                throw new ValidationException("Invalid IFSC code");
            }
        } else if (normalizedDestination.isBlank()) {
            throw new ValidationException("Enter a valid payout destination");
        }

        WalletAccount wallet = getOrCreateWallet(userId);
        if (wallet.getBalance() < amount) {
            throw new ValidationException("Insufficient wallet balance");
        }

        debitWallet(wallet, amount);
        saveWallet(wallet);

        String description = "BANK_ACCOUNT".equals(normalizedMethod)
                ? "Withdrawal requested for " + normalizedHolderName + " / " + normalizedAccountNumber
                : "Withdrawal requested via " + normalizedMethod + " / " + normalizedDestination;

        WalletTransactionRecord txn = createTransaction(
                userId,
                "WITHDRAW",
                -Math.abs(amount),
                "PENDING",
                description,
                null,
                normalizedMethod,
                "BANK_ACCOUNT".equals(normalizedMethod) ? normalizedAccountNumber : normalizedDestination
        );

        return Map.of(
                "message", "Withdrawal request created",
                "status", "PENDING",
                "transactionId", txn.getId(),
                "balance", wallet.getBalance()
        );
    }

    public Wallet debitForInvestment(String userId, double amount, String referenceId, String description) {
        if (amount <= 0) {
            throw new ValidationException("Investment amount must be greater than 0");
        }

        WalletAccount wallet = getOrCreateWallet(userId);
        if (wallet.getBalance() < amount) {
            throw new ValidationException("Insufficient wallet balance");
        }

        debitWallet(wallet, amount);
        saveWallet(wallet);

        createTransaction(
                userId,
                "INVESTMENT",
                -Math.abs(amount),
                "COMPLETED",
                description,
                referenceId,
                null,
                null
        );

        return toWallet(wallet);
    }

    public Wallet creditProfit(String userId, double amount, String referenceId, String description) {
        if (amount <= 0) {
            throw new ValidationException("Profit credit must be greater than 0");
        }

        WalletAccount wallet = getOrCreateWallet(userId);
        wallet.setProfits(wallet.getProfits() + amount);
        saveWallet(wallet);

        createTransaction(
                userId,
                "PROFIT_CREDIT",
                amount,
                "COMPLETED",
                description,
                referenceId,
                null,
                null
        );

        return toWallet(wallet);
    }

    public Wallet creditSalary(String userId, double amount, String referenceId, String description) {
        if (amount <= 0) {
            throw new ValidationException("Salary credit must be greater than 0");
        }

        WalletAccount wallet = getOrCreateWallet(userId);
        wallet.setProfits(wallet.getProfits() + amount);
        saveWallet(wallet);

        createTransaction(
                userId,
                "SALARY_CREDIT",
                amount,
                "COMPLETED",
                description,
                referenceId,
                null,
                null
        );

        return toWallet(wallet);
    }

    private WalletAccount getOrCreateWallet(String userId) {
        return walletAccountRepository.findById(userId)
                .orElseGet(() -> saveWallet(new WalletAccount(userId)));
    }

    private WalletAccount saveWallet(WalletAccount wallet) {
        wallet.setUpdatedAt(Instant.now());
        return walletAccountRepository.save(wallet);
    }

    private void debitWallet(WalletAccount wallet, double amount) {
        double remaining = amount;

        remaining = deductBucket(wallet.getRefunds(), remaining, wallet::setRefunds);
        remaining = deductBucket(wallet.getProfits(), remaining, wallet::setProfits);
        remaining = deductBucket(wallet.getPrincipal(), remaining, wallet::setPrincipal);
        deductBucket(wallet.getSip(), remaining, wallet::setSip);
    }

    private double deductBucket(double currentValue, double requestedAmount, java.util.function.DoubleConsumer setter) {
        if (requestedAmount <= 0) {
            return 0;
        }

        double deduction = Math.min(currentValue, requestedAmount);
        setter.accept(currentValue - deduction);
        return requestedAmount - deduction;
    }

    private WalletTransactionRecord createTransaction(String userId,
                                                      String type,
                                                      double amount,
                                                      String status,
                                                      String description,
                                                      String referenceId,
                                                      String payoutMethod,
                                                      String payoutDestination) {
        WalletTransactionRecord record = new WalletTransactionRecord();
        record.setId(UUID.randomUUID().toString());
        record.setUserId(userId);
        record.setType(type);
        record.setAmount(amount);
        record.setStatus(status);
        record.setDescription(description);
        record.setCreatedAt(Instant.now());
        record.setReferenceId(referenceId);
        record.setPayoutMethod(payoutMethod);
        record.setPayoutDestination(payoutDestination);
        return walletTransactionRepository.save(record);
    }

    private String normalizePayoutMethod(String payoutMethod) {
        if (payoutMethod == null || payoutMethod.isBlank()) {
            return "BANK_ACCOUNT";
        }

        String normalized = payoutMethod.trim().toUpperCase();
        return switch (normalized) {
            case "BANK_ACCOUNT", "UPI", "GPAY", "PAYTM", "PHONEPE", "OTHER_WALLET" -> normalized;
            default -> throw new ValidationException("Unsupported payout method");
        };
    }

    private Wallet toWallet(WalletAccount account) {
        return new Wallet(
                account.getUserId(),
                account.getPrincipal(),
                account.getProfits(),
                account.getRefunds(),
                account.getSip()
        );
    }

    private WalletTransaction toWalletTransaction(WalletTransactionRecord record) {
        return new WalletTransaction(
                record.getId(),
                record.getUserId(),
                record.getType(),
                record.getAmount(),
                record.getStatus(),
                record.getDescription(),
                record.getCreatedAt()
        );
    }
}
