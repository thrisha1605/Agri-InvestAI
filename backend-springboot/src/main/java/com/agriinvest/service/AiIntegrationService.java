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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AiIntegrationService {

    private final RestTemplate restTemplate;

    @Value("${ai.flask.base-url:http://localhost:5001}")
    private String flaskBaseUrl;

    public AiIntegrationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> recommendCrop(Map<String, Object> payload) {
        try {
            Map<?, ?> response = restTemplate.postForObject(
                    flaskBaseUrl + "/recommend-crop",
                    payload,
                    Map.class
            );
            return toMap(response);
        } catch (RestClientException exception) {
            throw new IllegalStateException("Unable to reach the Flask crop recommendation service.", exception);
        }
    }

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
                    return filename == null || filename.isBlank() ? "leaf-image.jpg" : filename;
                }
            };

            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);

            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("image", new HttpEntity<>(resource, fileHeaders));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            Map<?, ?> response = restTemplate.postForObject(
                    flaskBaseUrl + "/predict-disease",
                    new HttpEntity<>(form, headers),
                    Map.class
            );

            return toMap(response);
        } catch (RestClientException exception) {
            throw new IllegalStateException("Unable to reach the Flask disease detection service.", exception);
        }
    }

    private Map<String, Object> toMap(Map<?, ?> response) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (response == null) {
            return result;
        }
        response.forEach((key, value) -> result.put(String.valueOf(key), value));
        return result;
    }
}
