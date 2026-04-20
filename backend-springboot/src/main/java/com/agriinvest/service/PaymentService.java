package com.agriinvest.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.agriinvest.model.Payment;
import com.agriinvest.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    public Payment savePayment(
            String userId,
            String projectId,
            double amount,
            String orderId,
            String paymentId,
            String signature,
            String status,
            String verificationMessage,
            boolean investmentCreated
    ) {
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId).orElseGet(Payment::new);

        if (payment.getId() == null || payment.getId().isBlank()) {
            payment.setId(UUID.randomUUID().toString());
            payment.setCreatedAt(System.currentTimeMillis());
        }

        payment.setUserId(userId);
        payment.setProjectId(projectId);
        payment.setAmount(amount);
        payment.setRazorpayOrderId(orderId);
        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus(status);
        payment.setVerificationMessage(verificationMessage);
        payment.setInvestmentCreated(investmentCreated);
        payment.setVerifiedAt(Instant.now().toEpochMilli());

        return paymentRepository.save(payment);
    }

    public Payment markInvestmentCreated(String orderId, String successMessage) {
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found for orderId: " + orderId));

        payment.setInvestmentCreated(true);
        payment.setVerificationMessage(successMessage);
        payment.setVerifiedAt(Instant.now().toEpochMilli());

        return paymentRepository.save(payment);
    }
}