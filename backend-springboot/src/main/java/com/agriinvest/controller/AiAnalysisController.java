package com.agriinvest.controller;

import java.util.Map;

import org.bson.Document; // Required for generic saving
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate; // Best for saving Maps/Documents
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.agriinvest.service.AiIntegrationService;
import com.agriinvest.service.ProjectInsightService;

@RestController
@RequestMapping("/api/ai")
public class AiAnalysisController {

    private static final Logger logger = LoggerFactory.getLogger(AiAnalysisController.class);

    private final AiIntegrationService aiIntegrationService;
    private final ProjectInsightService projectInsightService;
    private final MongoTemplate mongoTemplate; // Injected to handle database saves

    public AiAnalysisController(AiIntegrationService aiIntegrationService,
                                ProjectInsightService projectInsightService,
                                MongoTemplate mongoTemplate) {
        this.aiIntegrationService = aiIntegrationService;
        this.projectInsightService = projectInsightService;
        this.mongoTemplate = mongoTemplate;
    }

    @PostMapping("/crop")
    public Map<String, Object> recommendCrop(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = aiIntegrationService.recommendCrop(payload);
        persistPrediction("crop_recommendation", response, null);
        return response;
    }

    @PostMapping(value = "/disease", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> diseasePrediction(@RequestParam("image") MultipartFile image) {
        Map<String, Object> response = aiIntegrationService.predictDisease(image);
        persistPrediction("disease_detection", response, Map.of(
                "filename", image.getOriginalFilename(),
                "contentType", image.getContentType(),
                "size", image.getSize()
        ));
        return response;
    }

    @PostMapping("/crop-analysis")
    public Map<String, Object> cropAnalysis(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.analyzeCrop(payload);
        persistPrediction("crop_analysis", response, payload);
        return response;
    }

    @PostMapping("/esg-score")
    public Map<String, Object> esgScore(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.scoreEsg(payload);
        persistPrediction("esg_score", response, payload);
        return response;
    }

    @PostMapping("/project-insights")
    public Map<String, Object> projectInsights(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.buildProjectInsights(payload);
        persistPrediction("project_insights", response, payload);
        return response;
    }

    private void persistPrediction(String type, Map<String, Object> response, Map<String, Object> inputPayload) {
        try {
            Document doc = new Document(response);
            doc.append("type", type);
            doc.append("timestamp", System.currentTimeMillis());
            if (inputPayload != null && !inputPayload.isEmpty()) {
                doc.append("input_payload", inputPayload);
            }
            mongoTemplate.save(doc, "predictions");
        } catch (Exception exception) {
            logger.warn("Skipping MongoDB save for {} because persistence is unavailable: {}", type, exception.getMessage());
        }
    }
}
