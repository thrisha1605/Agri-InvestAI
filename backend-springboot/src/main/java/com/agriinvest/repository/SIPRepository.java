package com.agriinvest.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.SIP;

public interface SIPRepository extends MongoRepository<SIP, String> {
    List<SIP> findByUserId(String userId);
    List<SIP> findByStatus(String status);
}