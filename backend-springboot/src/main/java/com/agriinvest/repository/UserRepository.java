package com.agriinvest.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.agriinvest.model.User;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // find user by email
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    java.util.List<User> findByRoleIgnoreCase(String role);

    // find user by phone (THIS FIXES YOUR ERROR)
    Optional<User> findByPhone(String phone);
    Optional<User> findByOtpId(String otpId);
}
