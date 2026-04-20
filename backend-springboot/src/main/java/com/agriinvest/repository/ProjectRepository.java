package com.agriinvest.repository;

import com.agriinvest.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProjectRepository extends MongoRepository<Project, String> {
    List<Project> findByFarmerId(String farmerId);
}