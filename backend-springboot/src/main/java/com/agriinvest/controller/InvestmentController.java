package com.agriinvest.controller;

import com.agriinvest.model.Investment;
import com.agriinvest.service.InvestmentService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {
    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    public record InvestRequest(@NotBlank String projectId, @Positive double amount, @NotBlank String paymentMethod) {}

    @PostMapping
    public Map<String, Object> invest(@RequestAttribute("authenticatedUserId") String investorId, @RequestBody InvestRequest request) {
        return investmentService.invest(investorId, request.projectId(), request.amount(), request.paymentMethod());
    }

    @GetMapping("/mine")
    public List<Investment> mine(@RequestAttribute("authenticatedUserId") String investorId) {
        return investmentService.myInvestments(investorId);
    }
}
