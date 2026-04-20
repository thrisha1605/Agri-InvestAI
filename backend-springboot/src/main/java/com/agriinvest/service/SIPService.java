package com.agriinvest.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.agriinvest.model.SIP;
import com.agriinvest.model.SIP.Interval;
import com.agriinvest.repository.SIPRepository;

import jakarta.validation.ValidationException;

@Service
public class SIPService {

    @Autowired
    private SIPRepository sipRepository;

    public SIP createSIP(String userId,
                         String projectId,
                         double amount,
                         String role,
                         Integer tenureYears,
                         String goalLabel,
                         Boolean termsAccepted,
                         String interval,
                         Boolean autoDebitEnabled) {
        if (amount < 50) {
            throw new ValidationException("Minimum SIP amount is Rs. 50");
        }

        int normalizedTenure = tenureYears == null || tenureYears <= 0 ? 1 : tenureYears;
        if (normalizedTenure != 1 && normalizedTenure != 3 && normalizedTenure != 5) {
            throw new ValidationException("Choose a 1, 3, or 5 year SIP term");
        }

        boolean acceptedTerms = termsAccepted == null || termsAccepted;
        if (!acceptedTerms) {
            throw new ValidationException("Please accept the SIP terms and conditions");
        }

        String normalizedRole = role == null || role.isBlank() ? "INVESTOR" : role.trim().toUpperCase();
        double expectedAnnualReturn = switch (normalizedRole) {
            case "FARMER" -> 11.0;
            case "AGRI_PARTNER" -> 12.0;
            case "ADMIN" -> 10.0;
            default -> 14.0;
        };

        Interval normalizedInterval = parseInterval(interval);
        Instant startInstant = Instant.now();
        boolean autoDebit = autoDebitEnabled == null || autoDebitEnabled;

        SIP sip = new SIP();
        sip.setId(UUID.randomUUID().toString());
        sip.setUserId(userId);
        sip.setProjectId(projectId);
        sip.setAmount(amount);
        sip.setRole(normalizedRole);
        sip.setTenureYears(normalizedTenure);
        sip.setExpectedAnnualReturn(expectedAnnualReturn);
        sip.setProvider("AgriInvest Secure SIP");
        sip.setGoalLabel(goalLabel == null || goalLabel.isBlank() ? "Goal-based savings" : goalLabel.trim());
        sip.setTermsAccepted(acceptedTerms);
        sip.setStatus("ACTIVE");
        sip.setStartDate(startInstant.toEpochMilli());
        sip.setInterval(normalizedInterval);
        sip.setNextDebitDate(calculateNextDebitDate(startInstant, normalizedInterval));
        sip.setEstimatedMaturity(roundMoney(estimateMaturity(amount, normalizedTenure, expectedAnnualReturn, normalizedInterval)));
        sip.setAutoDebitEnabled(autoDebit);
        sip.setAutoDebitStatus(autoDebit ? "PENDING_MANDATE_SETUP" : "DISABLED");
        sip.setAutoDebitProvider(autoDebit ? "RAZORPAY" : "MANUAL");
        sip.setAutoDebitPreparedAt(System.currentTimeMillis());
        sip.setAutoDebitFrequency(normalizedInterval.name());
        sip.setAutoDebitAmountPaise(Math.round(amount * 100));
        sip.setDebitMode(autoDebit ? "AUTO_DEBIT" : "MANUAL");
        sip.setAutoDebitMandateReference(autoDebit ? "mandate_" + sip.getId() : "");
        sip.setAutoDebitPlanId(autoDebit ? "plan_" + normalizedInterval.name().toLowerCase() + "_" + sip.getProjectId() : "");

        return sipRepository.save(sip);
    }

    public List<SIP> getUserSIPs(String userId) {
        return sipRepository.findByUserId(userId);
    }

    public List<SIP> getAllSIPs() {
        return sipRepository.findAll();
    }

    public SIP stopSIP(String userId, String projectId) {
        SIP sip = sipRepository.findByUserId(userId)
                .stream()
                .filter(item -> item.getProjectId().equals(projectId) && "ACTIVE".equals(item.getStatus()))
                .findFirst()
                .orElseThrow(() -> new ValidationException("Active SIP not found"));

        sip.setStatus("STOPPED");
        sip.setAutoDebitEnabled(false);
        sip.setAutoDebitStatus("STOPPED");
        return sipRepository.save(sip);
    }

    public SIP stopSIPById(String sipId) {
        SIP sip = sipRepository.findById(sipId)
                .orElseThrow(() -> new ValidationException("SIP not found"));

        sip.setStatus("STOPPED");
        sip.setAutoDebitEnabled(false);
        sip.setAutoDebitStatus("STOPPED");
        return sipRepository.save(sip);
    }

    public SIP markProcessed(SIP sip) {
        Instant currentNextDebit = Instant.ofEpochMilli(sip.getNextDebitDate());
        sip.setNextDebitDate(calculateNextDebitDate(currentNextDebit, sip.getInterval() == null ? Interval.MONTHLY : sip.getInterval()));
        sip.setAutoDebitStatus("SCHEDULED");
        return sipRepository.save(sip);
    }

    private Interval parseInterval(String interval) {
        if (interval == null || interval.isBlank()) {
            return Interval.MONTHLY;
        }

        try {
            return Interval.valueOf(interval.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ValidationException("Interval must be one of DAILY, WEEKLY, FIFTEEN_DAYS, MONTHLY");
        }
    }

    private long calculateNextDebitDate(Instant baseInstant, Interval interval) {
        return switch (interval) {
            case DAILY -> baseInstant.plus(1, ChronoUnit.DAYS).toEpochMilli();
            case WEEKLY -> baseInstant.plus(7, ChronoUnit.DAYS).toEpochMilli();
            case FIFTEEN_DAYS -> baseInstant.plus(15, ChronoUnit.DAYS).toEpochMilli();
            case MONTHLY -> baseInstant.plus(30, ChronoUnit.DAYS).toEpochMilli();
        };
    }

    private double estimateMaturity(double installmentAmount, int tenureYears, double annualRate, Interval interval) {
        int periodsPerYear = switch (interval) {
            case DAILY -> 365;
            case WEEKLY -> 52;
            case FIFTEEN_DAYS -> 24;
            case MONTHLY -> 12;
        };

        int periods = tenureYears * periodsPerYear;
        double periodicRate = annualRate / periodsPerYear / 100;

        if (periodicRate == 0) {
            return installmentAmount * periods;
        }

        return installmentAmount
                * ((Math.pow(1 + periodicRate, periods) - 1) / periodicRate)
                * (1 + periodicRate);
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
