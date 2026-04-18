package com.agriinvest.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agriinvest.model.PartnerProfile;
import com.agriinvest.service.PartnerProfileService;

@RestController
@RequestMapping("/api/partner-profiles")
public class PartnerProfileController {

    private final PartnerProfileService partnerProfileService;

    public PartnerProfileController(PartnerProfileService partnerProfileService) {
        this.partnerProfileService = partnerProfileService;
    }

    @GetMapping
    public List<PartnerProfile> listProfiles() {
        return partnerProfileService.listProfiles();
    }

    @GetMapping("/{userId}")
    public PartnerProfile getProfile(@PathVariable String userId) {
        return partnerProfileService.getProfile(userId);
    }

    @PutMapping("/{userId}")
    public PartnerProfile saveProfile(@PathVariable String userId, @RequestBody PartnerProfile payload) {
        return partnerProfileService.saveProfile(userId, payload);
    }
}
