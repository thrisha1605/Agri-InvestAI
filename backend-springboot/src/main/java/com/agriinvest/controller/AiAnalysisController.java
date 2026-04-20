package com.agriinvest.controller;

import java.util.Map;

import org.bson.Document; // Required for generic saving
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
        
        // SAVE TO MONGODB: This creates the database and collection automatically
        Document doc = new Document(response);
        doc.append("type", "crop_recommendation");
        doc.append("timestamp", System.currentTimeMillis());
        mongoTemplate.save(doc, "predictions"); 
        
        return response;
    }
@PostMapping(value = "/disease", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> diseasePrediction(@RequestParam("image") MultipartFile image) {
        // Change @RequestPart to @RequestParam above
        Map<String, Object> response = aiIntegrationService.predictDisease(image);
        
        // SAVE TO MONGODB
        Document doc = new Document(response);
        doc.append("type", "disease_detection");
        doc.append("timestamp", System.currentTimeMillis());
        mongoTemplate.save(doc, "predictions");
        
        return response;
    }

   @PostMapping("/crop-analysis")
    public Map<String, Object> cropAnalysis(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.analyzeCrop(payload);
        
        // SAVE TO MONGODB
        Document doc = new Document(response);
        doc.append("type", "crop_analysis");
        doc.append("input_payload", payload); // Optional: saves what the user sent too
        doc.append("timestamp", System.currentTimeMillis());
        mongoTemplate.save(doc, "predictions");
        
        return response;
    }
@PostMapping("/esg-score")
    public Map<String, Object> esgScore(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.scoreEsg(payload);
        
        // SAVE TO MONGODB
        Document doc = new Document(response);
        doc.append("type", "esg_score");
        doc.append("timestamp", System.currentTimeMillis());
        mongoTemplate.save(doc, "predictions");
        
        return response;
    }

    @PostMapping("/project-insights")
    public Map<String, Object> projectInsights(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = projectInsightService.buildProjectInsights(payload);
        
        // SAVE TO MONGODB
        Document doc = new Document(response);
        doc.append("type", "project_insights");
        doc.append("timestamp", System.currentTimeMillis());
        mongoTemplate.save(doc, "predictions");
        
        return response;
    }
}