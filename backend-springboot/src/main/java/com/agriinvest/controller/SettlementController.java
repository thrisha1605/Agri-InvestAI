package com.agriinvest.controller;

import com.agriinvest.service.ProjectService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settlements")
public class SettlementController {
    private final ProjectService projectService;

    public SettlementController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/{projectId}/preview")
    public Map<String, Object> preview(@PathVariable String projectId,
                                       @RequestParam double totalProfit,
                                       @RequestParam(required = false) Integer monthsWorked) {
        return projectService.settlementPreview(projectId, totalProfit, monthsWorked, java.util.List.of());
    }
}
