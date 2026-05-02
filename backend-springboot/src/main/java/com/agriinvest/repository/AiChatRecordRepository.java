package com.agriinvest.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.AiChatRecord;

public interface AiChatRecordRepository extends MongoRepository<AiChatRecord, String> {

    List<AiChatRecord> findByUserIdAndRoleOrderByCreatedAtAsc(String userId, String role);

    void deleteByUserIdAndRole(String userId, String role);
}
