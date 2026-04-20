package com.agriinvest.controller;

import com.agriinvest.model.User;
import com.agriinvest.store.InMemoryStore;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meta")
public class MetaController {
    private final InMemoryStore store;

    public MetaController(InMemoryStore store) {
        this.store = store;
    }

    @GetMapping("/demo-users")
    public List<Map<String, String>> demoUsers() {
        return store.users.values().stream().map(this::toMap).collect(Collectors.toList());
    }

    private Map<String, String> toMap(User user) {
        return Map.of(
                "userId", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "role", user.getRole()
        );
    }
}
