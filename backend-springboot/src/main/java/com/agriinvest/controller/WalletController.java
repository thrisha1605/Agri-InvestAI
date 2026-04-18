package com.agriinvest.controller;

import com.agriinvest.model.Wallet;
import com.agriinvest.model.WalletTransaction;
import com.agriinvest.service.WalletService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    public record AmountRequest(@Positive double amount) {}
    public record WithdrawRequest(@Positive double amount,
                                  String payoutMethod,
                                  String payoutDestination,
                                  String accountNumber,
                                  String ifsc,
                                  String holderName) {}

    @GetMapping
    public Wallet wallet(@RequestAttribute("authenticatedUserId") String userId) {
        return walletService.getWallet(userId);
    }

    @GetMapping("/transactions")
    public List<WalletTransaction> transactions(@RequestAttribute("authenticatedUserId") String userId) {
        return walletService.transactions(userId);
    }

    @PostMapping("/add-money/confirm")
    public Map<String, Object> addMoney(@RequestAttribute("authenticatedUserId") String userId, @RequestBody AmountRequest request) {
        return walletService.addMoney(userId, request.amount());
    }

    @PostMapping("/withdraw")
    public Map<String, Object> withdraw(@RequestAttribute("authenticatedUserId") String userId, @RequestBody WithdrawRequest request) {
        return walletService.withdraw(
                userId,
                request.amount(),
                request.payoutMethod(),
                request.payoutDestination(),
                request.holderName(),
                request.accountNumber(),
                request.ifsc()
        );
    }
}
