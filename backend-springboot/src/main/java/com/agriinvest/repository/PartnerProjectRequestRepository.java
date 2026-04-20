package com.agriinvest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.agriinvest.model.PartnerProjectRequest;

@Repository
public interface PartnerProjectRequestRepository extends MongoRepository<PartnerProjectRequest, String> {

    List<PartnerProjectRequest> findAllByOrderByCreatedAtDesc();

    List<PartnerProjectRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<PartnerProjectRequest> findByPartnerIdOrderByCreatedAtDesc(String partnerId);

    List<PartnerProjectRequest> findByProjectIdOrderByCreatedAtDesc(String projectId);

    Optional<PartnerProjectRequest> findByProjectIdAndPartnerId(String projectId, String partnerId);
}