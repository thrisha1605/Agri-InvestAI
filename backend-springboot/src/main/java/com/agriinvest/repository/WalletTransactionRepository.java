package com.agriinvest.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.WalletTransactionRecord;

public interface WalletTransactionRepository extends MongoRepository<WalletTransactionRecord, String> {
    List<WalletTransactionRecord> findByUserIdOrderByCreatedAtDesc(String userId);
}
