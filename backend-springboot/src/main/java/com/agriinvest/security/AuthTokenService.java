package com.agriinvest.security;

import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthTokenService {
    private final ConcurrentHashMap<String, String> tokenToUser = new ConcurrentHashMap<>();

    public String createToken(String userId) {
        String token = UUID.randomUUID().toString();
        tokenToUser.put(token, userId);
        return token;
    }

    public Optional<String> getUserId(String token) {
        return Optional.ofNullable(tokenToUser.get(token));
    }

    public void revokeToken(String token) {
        tokenToUser.remove(token);
    }
}
