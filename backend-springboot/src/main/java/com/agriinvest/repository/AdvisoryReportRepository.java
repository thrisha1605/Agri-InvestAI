package com.agriinvest.repository;

import com.agriinvest.model.AdvisoryReport;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AdvisoryReportRepository extends MongoRepository<AdvisoryReport, String> {
    List<AdvisoryReport> findByProjectIdOrderByCreatedAtDesc(String projectId);
}