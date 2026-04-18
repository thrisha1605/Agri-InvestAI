package com.agriinvest.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.agriinvest.service.AiIntegrationService;
import com.agriinvest.service.ProjectInsightService;

@RestController
@RequestMapping("/api/ai")
public class AiAnalysisController {

    private final AiIntegrationService aiIntegrationService;
    private final ProjectInsightService projectInsightService;

    public AiAnalysisController(AiIntegrationService aiIntegrationService,
                                ProjectInsightService projectInsightService) {
        this.aiIntegrationService = aiIntegrationService;
        this.projectInsightService = projectInsightService;
    }

    @PostMapping("/crop")
    public Map<String, Object> recommendCrop(@RequestBody Map<String, Object> payload) {
        return aiIntegrationService.recommendCrop(payload);
    }

    @PostMapping("/crop-analysis")
    public Map<String, Object> cropAnalysis(@RequestBody Map<String, Object> payload) {
        return projectInsightService.analyzeCrop(payload);
    }

    @PostMapping("/esg-score")
    public Map<String, Object> esgScore(@RequestBody Map<String, Object> payload) {
        return projectInsightService.scoreEsg(payload);
    }

    @PostMapping("/project-insights")
    public Map<String, Object> projectInsights(@RequestBody Map<String, Object> payload) {
        return projectInsightService.buildProjectInsights(payload);
    }

    @PostMapping(value = "/disease", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> diseasePrediction(@RequestPart("image") MultipartFile image) {
        return aiIntegrationService.predictDisease(image);
    }
}
