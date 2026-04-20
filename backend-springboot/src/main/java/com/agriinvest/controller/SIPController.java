package com.agriinvest.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.model.SIP;
import com.agriinvest.service.SIPService;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@RestController
public class SIPController {

    @Autowired
    private SIPService sipService;

    public record CreateSipRequest(@NotBlank String userId,
                                   @NotBlank String projectId,
                                   @Positive double amount,
                                   String role,
                                   Integer tenureYears,
                                   String goalLabel,
                                   Boolean termsAccepted,
                                   String interval,
                                   Boolean autoDebitEnabled) {
    }

    public record StopSipRequest(@NotBlank String userId, @NotBlank String projectId) {
    }

    @PostMapping({"/api/sip/create", "/api/sips"})
    public SIP createSIP(@RequestBody CreateSipRequest request) {
        return sipService.createSIP(
                request.userId(),
                request.projectId(),
                request.amount(),
                request.role(),
                request.tenureYears(),
                request.goalLabel(),
                request.termsAccepted(),
                request.interval(),
                request.autoDebitEnabled()
        );
    }

    @PostMapping("/api/sip/stop")
    public SIP stopSIP(@RequestBody StopSipRequest request) {
        return sipService.stopSIP(request.userId(), request.projectId());
    }

    @PostMapping("/api/sips/{sipId}/stop")
    public SIP stopSIPById(@PathVariable String sipId) {
        return sipService.stopSIPById(sipId);
    }

    @GetMapping("/api/sip/user/{userId}")
    public List<SIP> getUserSIPs(@PathVariable String userId) {
        return sipService.getUserSIPs(userId);
    }

    @GetMapping("/api/sips")
    public List<SIP> listSIPs(@RequestParam(required = false) String userId) {
        return userId == null || userId.isBlank()
                ? sipService.getAllSIPs()
                : sipService.getUserSIPs(userId);
    }
}
