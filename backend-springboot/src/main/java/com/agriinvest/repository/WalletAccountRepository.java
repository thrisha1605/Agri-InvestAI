package com.agriinvest.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.WalletAccount;

public interface WalletAccountRepository extends MongoRepository<WalletAccount, String> {
}
