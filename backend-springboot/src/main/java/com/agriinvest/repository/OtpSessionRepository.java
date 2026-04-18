package com.agriinvest.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.agriinvest.model.OtpSession;

@Repository
public interface OtpSessionRepository extends MongoRepository<OtpSession, String> {
}
