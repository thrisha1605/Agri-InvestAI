package com.agriinvest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.agriinvest.model.UserNotification;

@Repository
public interface UserNotificationRepository extends MongoRepository<UserNotification, String> {
    List<UserNotification> findByUserIdOrderByTimestampDesc(String userId);

    Optional<UserNotification> findByIdAndUserId(String id, String userId);
}
