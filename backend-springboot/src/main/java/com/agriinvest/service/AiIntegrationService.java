package com.agriinvest.service;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AiIntegrationService {

    private final RestTemplate restTemplate;

    @Value("${ai.module.url}")
    private String flaskUrl; 

    public AiIntegrationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> recommendCrop(Map<String, Object> data) {
        try {
            Map<String, Object> pythonPayload = new LinkedHashMap<>();
            pythonPayload.put("N", data.getOrDefault("N", data.get("nitrogen")));
            pythonPayload.put("P", data.getOrDefault("P", data.get("phosphorus")));
            pythonPayload.put("K", data.getOrDefault("K", data.get("potassium")));
            pythonPayload.put("temperature", data.get("temperature"));
            pythonPayload.put("humidity", data.get("humidity"));
            pythonPayload.put("rainfall", data.get("rainfall"));
            pythonPayload.put("ph", data.get("ph"));
            return restTemplate.postForObject(flaskUrl, pythonPayload, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Flask connection failed: " + e.getMessage());
        }
    }

    // THIS IS THE MISSING METHOD THAT FIXES THE COMPILATION ERROR
    public Map<String, Object> predictDisease(MultipartFile image) {
        try {
            return predictDisease(image.getBytes(), image.getOriginalFilename());
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read the uploaded image.", exception);
        }
    }

    public Map<String, Object> predictDisease(byte[] imageBytes, String filename) {
        try {
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return filename == null || filename.isBlank() ? "leaf.jpg" : filename;
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new HttpEntity<>(resource));

            String baseUrl = flaskUrl.substring(0, flaskUrl.lastIndexOf("/"));
            String diseaseUrl = baseUrl + "/predict-disease";

            Map<?, ?> response = restTemplate.postForObject(diseaseUrl, new HttpEntity<>(body, headers), Map.class);
            return toMap(response);
        } catch (Exception e) {
            throw new RuntimeException("Disease Detection Error: " + e.getMessage());
        }
    }

    private Map<String, Object> toMap(Map<?, ?> response) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (response == null) return result;
        response.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }
}