package com.agriinvest.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.agriinvest.model.Investment;

@Repository
public interface InvestmentRepository extends MongoRepository<Investment, String> {
    List<Investment> findByInvestorId(String investorId);
    List<Investment> findByProjectId(String projectId);

}
