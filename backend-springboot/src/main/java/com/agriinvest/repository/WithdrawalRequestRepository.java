package com.agriinvest.repository;

import com.agriinvest.model.WithdrawalRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WithdrawalRequestRepository extends MongoRepository<WithdrawalRequest, String> {
    List<WithdrawalRequest> findAllByOrderByDateDesc();
    List<WithdrawalRequest> findByStatusOrderByDateDesc(String status);
    List<WithdrawalRequest> findByProjectIdOrderByDateDesc(String projectId);
}
