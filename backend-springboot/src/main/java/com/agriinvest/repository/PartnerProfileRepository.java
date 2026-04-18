package com.agriinvest.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.agriinvest.model.PartnerProfile;

public interface PartnerProfileRepository extends MongoRepository<PartnerProfile, String> {
}
