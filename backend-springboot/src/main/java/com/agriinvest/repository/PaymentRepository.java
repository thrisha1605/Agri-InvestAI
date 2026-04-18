package com.agriinvest.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.Payment;

public interface PaymentRepository extends MongoRepository<Payment, String> {

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
}