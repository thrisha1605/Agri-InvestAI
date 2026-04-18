package com.agriinvest.repository;

import com.agriinvest.model.ProjectMilestoneUpdate;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProjectMilestoneUpdateRepository extends MongoRepository<ProjectMilestoneUpdate, String> {
    List<ProjectMilestoneUpdate> findByProjectIdOrderByCreatedAtDesc(String projectId);
}
