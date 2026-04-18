package com.agriinvest.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.validation.ValidationException;

@Service
public class ProjectInsightService {

    private static final double DEFAULT_BOREWELL_COST = 120000.0;
    private static final double BOREWELL_MIN_COST = 110000.0;
    private static final double BOREWELL_MAX_COST = 180000.0;

    private final ObjectMapper objectMapper;
    private final AiIntegrationService aiIntegrationService;
    private final Map<String, CropProfile> profilesByKey = new LinkedHashMap<>();

    public ProjectInsightService(ObjectMapper objectMapper,
                                 AiIntegrationService aiIntegrationService) {
        this.objectMapper = objectMapper;
        this.aiIntegrationService = aiIntegrationService;
    }

    @PostConstruct
    public void loadProfiles() throws IOException {
        ClassPathResource resource = new ClassPathResource("agri/crop_profiles.json");
        List<CropProfile> profiles = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<CropProfile>>() {
                }
        );

        for (CropProfile profile : profiles) {
            profilesByKey.put(normalizeKey(profile.code()), profile);
            profilesByKey.put(normalizeKey(profile.label()), profile);
            if (profile.aliases() != null) {
                profile.aliases().forEach(alias -> profilesByKey.put(normalizeKey(alias), profile));
            }
        }
    }

    public Map<String, Object> analyzeCrop(Map<String, Object> payload) {
        String requestedCrop = firstText(payload, "cropType", "crop");
        CropProfile profile = findProfile(requestedCrop)
                .orElseThrow(() -> new ValidationException("Unsupported crop type: " + requestedCrop));

        String soilType = firstText(payload, "soilType");
        Double acreage = firstNumber(payload, "acres", "acreage");
        Double temperature = firstNumber(payload, "temperature", "avgTemperature");
        Double humidity = firstNumber(payload, "humidity");
        Double rainfall = firstNumber(payload, "rainfall");
        Double ph = firstNumber(payload, "ph", "soilPH");
        Double nitrogen = firstNumber(payload, "N", "nitrogen");
        Double phosphorus = firstNumber(payload, "P", "phosphorus");
        Double potassium = firstNumber(payload, "K", "potassium");

        if (acreage == null || acreage <= 0) {
            throw new ValidationException("Acreage must be greater than zero.");
        }

        Map<String, Object> breakdown = new LinkedHashMap<>();
        List<Double> scores = new ArrayList<>();

        double soilScore = scoreSoil(soilType, profile.preferredSoils());
        breakdown.put("soil", round(soilScore));
        scores.add(soilScore);

        addRangeScore("temperature", temperature, profile.temperature(), breakdown, scores);
        addRangeScore("humidity", humidity, profile.humidity(), breakdown, scores);
        addRangeScore("rainfall", rainfall, profile.rainfall(), breakdown, scores);
        addRangeScore("ph", ph, profile.ph(), breakdown, scores);
        addRangeScore("nitrogen", nitrogen, profile.nitrogen(), breakdown, scores);
        addRangeScore("phosphorus", phosphorus, profile.phosphorus(), breakdown, scores);
        addRangeScore("potassium", potassium, profile.potassium(), breakdown, scores);

        double suitabilityScore = round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
        double yieldFactor = Math.max(0.55, suitabilityScore / 100.0);
        double expectedYield = round(acreage * profile.yieldPerAcreQuintal() * yieldFactor);
        double costEstimate = round(acreage * profile.costPerAcre());
        double revenueEstimate = round(expectedYield * profile.pricePerQuintal());
        double profitEstimate = round(revenueEstimate - costEstimate);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("crop", profile.label());
        response.put("cropCode", profile.code());
        response.put("suitabilityScore", suitabilityScore);
        response.put("scoringBreakdown", breakdown);
        response.put("baselineYieldPerAcreQuintal", round(profile.yieldPerAcreQuintal()));
        response.put("expectedYield", expectedYield);
        response.put("yieldUnit", "quintal");
        response.put("referencePricePerQuintal", round(profile.pricePerQuintal()));
        response.put("costPerAcre", round(profile.costPerAcre()));
        response.put("costEstimate", costEstimate);
        response.put("revenueEstimate", revenueEstimate);
        response.put("profitEstimate", profitEstimate);
        response.put("riskLevel", deriveRisk(suitabilityScore));
        response.put("waterUsageLevel", profile.waterUsageLevel());
        response.put("recommendedActions", buildRecommendedActions(breakdown, profile));
        response.put("alternativeCrops", buildAlternativeCrops(payload));

        if (hasRecommendationInputs(payload)) {
            try {
                Map<String, Object> recommendation = aiIntegrationService.recommendCrop(buildCropRecommendationPayload(payload));
                response.put("aiRecommendation", recommendation);
            } catch (RuntimeException exception) {
                response.put("aiRecommendationError", exception.getMessage());
            }
        }

        return response;
    }

    public Map<String, Object> scoreEsg(Map<String, Object> payload) {
        double waterUsage = Optional.ofNullable(firstNumber(payload, "waterUsage")).orElse(0.0);
        String fertilizerType = Optional.ofNullable(firstText(payload, "fertilizerType")).orElse("CHEMICAL");
        String pesticideLevel = Optional.ofNullable(firstText(payload, "pesticideLevel")).orElse("MEDIUM");
        double renewableEnergy = Optional.ofNullable(firstNumber(payload, "renewableEnergy")).orElse(0.0);
        double workersEmployed = Optional.ofNullable(firstNumber(payload, "workersEmployed")).orElse(0.0);
        boolean fairWages = Boolean.TRUE.equals(payload.get("fairWages"));
        double communityBenefit = Optional.ofNullable(firstNumber(payload, "communityBenefit")).orElse(0.0);
        double documentsUploaded = Optional.ofNullable(firstNumber(payload, "documentsUploaded")).orElse(0.0);
        double transparencyScore = Optional.ofNullable(firstNumber(payload, "transparencyScore")).orElse(0.0);
        double trustScore = Optional.ofNullable(firstNumber(payload, "trustScore")).orElse(0.0);

        double environmental = round(average(
                scoreWaterUsage(waterUsage),
                scoreFertilizerType(fertilizerType),
                scorePesticideLevel(pesticideLevel),
                clamp(renewableEnergy)
        ));

        double social = round(average(
                Math.min(100.0, 20.0 + (workersEmployed * 14.0)),
                fairWages ? 90.0 : 35.0,
                clamp(communityBenefit)
        ));

        double governance = round(average(
                Math.min(100.0, (documentsUploaded / 6.0) * 100.0),
                clamp(transparencyScore),
                clamp(trustScore)
        ));

        double finalScore = round((environmental * 0.4) + (social * 0.3) + (governance * 0.3));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("environmentalScore", environmental);
        response.put("socialScore", social);
        response.put("governanceScore", governance);
        response.put("finalESGScore", finalScore);
        response.put("label", deriveEsgLabel(finalScore));
        return response;
    }

    public Map<String, Object> buildProjectInsights(Map<String, Object> payload) {
        Map<String, Object> landDetails = asMap(payload.get("landDetails"));
        Map<String, Object> cropInfo = asMap(payload.get("cropInfo"));
        Map<String, Object> irrigation = asMap(payload.get("irrigation"));
        Map<String, Object> funding = asMap(payload.get("funding"));
        Map<String, Object> esg = new LinkedHashMap<>(asMap(payload.get("esg")));

        int uploadedDocumentCount = countDocuments(payload.get("documents"));
        if (uploadedDocumentCount > 0) {
            esg.put("documentsUploaded", uploadedDocumentCount);
        }

        Map<String, Object> cropAnalysis = Collections.emptyMap();
        String cropAnalysisError = null;
        if (!cropInfo.isEmpty() && firstText(cropInfo, "cropType") != null) {
            Map<String, Object> analysisPayload = new LinkedHashMap<>();
            analysisPayload.put("cropType", firstText(cropInfo, "cropType"));
            analysisPayload.put("soilType", firstText(landDetails, "soilType"));
            analysisPayload.put("acres", firstNumber(landDetails, "acreage"));
            analysisPayload.put("temperature", firstNumber(landDetails, "temperature", "averageTemperature"));
            analysisPayload.put("humidity", firstNumber(landDetails, "humidity"));
            analysisPayload.put("rainfall", firstNumber(landDetails, "rainfall"));
            analysisPayload.put("ph", firstNumber(landDetails, "soilPH", "ph"));
            analysisPayload.put("N", firstNumber(cropInfo, "nitrogen", "N"));
            analysisPayload.put("P", firstNumber(cropInfo, "phosphorus", "P"));
            analysisPayload.put("K", firstNumber(cropInfo, "potassium", "K"));
            try {
                cropAnalysis = analyzeCrop(analysisPayload);
            } catch (RuntimeException exception) {
                cropAnalysisError = exception.getMessage();
            }
        }

        Map<String, Object> waterPlan = analyzeWaterRequirement(irrigation, funding);
        Map<String, Object> esgSummary = esg.isEmpty() ? Collections.emptyMap() : scoreEsg(esg);

        double baseFunding = round(sumNumbers(
                firstNumber(funding, "seedsCost"),
                firstNumber(funding, "fertilizersCost"),
                firstNumber(funding, "pesticidesCost"),
                firstNumber(funding, "laborCost"),
                firstNumber(funding, "irrigationCost"),
                firstNumber(funding, "machineryRental"),
                firstNumber(funding, "otherCosts")
        ));
        double waterCost = Optional.ofNullable(firstNumber(waterPlan, "waterCost")).orElse(0.0);
        double totalInvestment = round(baseFunding + waterCost);
        double revenueEstimate = Optional.ofNullable(firstNumber(cropAnalysis, "revenueEstimate")).orElse(firstNumber(payload, "expectedRevenue") == null ? 0.0 : firstNumber(payload, "expectedRevenue"));
        double expectedYield = Optional.ofNullable(firstNumber(cropAnalysis, "expectedYield")).orElse(firstNumber(payload, "expectedYield") == null ? 0.0 : firstNumber(payload, "expectedYield"));
        double expectedROI = totalInvestment <= 0 ? 0.0 : round(((revenueEstimate - totalInvestment) / totalInvestment) * 100.0);

        List<String> investorAlerts = new ArrayList<>();
        if (Boolean.TRUE.equals(waterPlan.get("needsWaterInvestment"))) {
            investorAlerts.add("Water infrastructure required");
        }
        if ("HIGH".equals(cropAnalysis.get("riskLevel"))) {
            investorAlerts.add("High agronomic risk");
        }
        if (firstNumber(esgSummary, "finalESGScore") != null && firstNumber(esgSummary, "finalESGScore") < 50) {
            investorAlerts.add("Low ESG score");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("cropAnalysis", cropAnalysis);
        response.put("waterAnalysis", waterPlan);
        response.put("esgBreakdown", esgSummary);
        response.put("waterCost", waterCost);
        response.put("needsWaterInvestment", Boolean.TRUE.equals(waterPlan.get("needsWaterInvestment")));
        response.put("totalInvestment", totalInvestment);
        response.put("fundingGoal", totalInvestment > 0 ? totalInvestment : baseFunding);
        response.put("estimatedExpenses", totalInvestment > 0 ? totalInvestment : baseFunding);
        response.put("expectedRevenue", revenueEstimate);
        response.put("expectedYield", expectedYield);
        response.put("expectedROI", expectedROI);
        response.put("riskLevel", cropAnalysis.getOrDefault("riskLevel", payload.get("riskLevel")));
        response.put("esgScore", esgSummary.getOrDefault("finalESGScore", payload.get("esgScore")));
        response.put("investorAlerts", investorAlerts);
        response.put("waterInvestmentLabel", waterPlan.get("label"));
        if (cropAnalysisError != null) {
            response.put("cropAnalysisError", cropAnalysisError);
        }
        return response;
    }

    public boolean shouldRefreshInsights(Map<String, Object> payload) {
        return payload.containsKey("landDetails")
                || payload.containsKey("cropInfo")
                || payload.containsKey("irrigation")
                || payload.containsKey("funding")
                || payload.containsKey("esg")
                || payload.containsKey("waterSource");
    }

    public Map<String, Object> analyzeWaterRequirement(Map<String, Object> irrigation, Map<String, Object> funding) {
        String waterSource = firstText(irrigation, "waterSource");
        if (waterSource == null) {
            waterSource = firstText(funding, "waterSource");
        }

        boolean noWaterSource = waterSource == null
                || waterSource.isBlank()
                || "NONE".equalsIgnoreCase(waterSource)
                || "NO_WATER".equalsIgnoreCase(waterSource);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("waterSource", waterSource);
        response.put("needsWaterInvestment", noWaterSource);
        response.put("waterGapDetected", noWaterSource);
        response.put("waterCost", noWaterSource ? DEFAULT_BOREWELL_COST : 0.0);
        response.put("costRangeMin", noWaterSource ? BOREWELL_MIN_COST : 0.0);
        response.put("costRangeMax", noWaterSource ? BOREWELL_MAX_COST : 0.0);
        response.put("label", noWaterSource ? "Water infrastructure required" : "Existing water source available");
        response.put(
                "recommendation",
                noWaterSource
                        ? "Borewell installation recommended with pump and pipe setup."
                        : "Existing water access is available for the current project plan."
        );
        response.put(
                "breakdown",
                noWaterSource
                        ? Map.of(
                                "drilling", 90000.0,
                                "pump", 20000.0,
                                "pipes", 10000.0
                        )
                        : Map.of()
        );
        return response;
    }

    private Optional<CropProfile> findProfile(String cropType) {
        if (cropType == null || cropType.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(profilesByKey.get(normalizeKey(cropType)));
    }

    public Optional<CropProfile> getCropProfile(String cropType) {
        return findProfile(cropType);
    }

    public List<CropProfile> getCropProfiles() {
        return profilesByKey.values().stream().distinct().toList();
    }

    private List<Map<String, Object>> buildAlternativeCrops(Map<String, Object> payload) {
        String selected = firstText(payload, "cropType", "crop");
        List<Map<String, Object>> alternatives = new ArrayList<>();

        profilesByKey.values().stream()
                .distinct()
                .filter(profile -> !Objects.equals(normalizeKey(profile.code()), normalizeKey(selected)))
                .map(profile -> {
                    Map<String, Object> candidate = new LinkedHashMap<>();
                    candidate.put("cropCode", profile.code());
                    candidate.put("crop", profile.label());
                    candidate.put("score", scoreProfile(payload, profile));
                    return candidate;
                })
                .sorted((left, right) -> Double.compare((Double) right.get("score"), (Double) left.get("score")))
                .limit(3)
                .forEach(alternatives::add);

        return alternatives;
    }

    private double scoreProfile(Map<String, Object> payload, CropProfile profile) {
        List<Double> scores = new ArrayList<>();
        scores.add(scoreSoil(firstText(payload, "soilType"), profile.preferredSoils()));
        addNullableScore(scores, firstNumber(payload, "temperature", "avgTemperature"), profile.temperature());
        addNullableScore(scores, firstNumber(payload, "humidity"), profile.humidity());
        addNullableScore(scores, firstNumber(payload, "rainfall"), profile.rainfall());
        addNullableScore(scores, firstNumber(payload, "ph", "soilPH"), profile.ph());
        return round(scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0));
    }

    private void addNullableScore(List<Double> scores, Double value, Range range) {
        if (value != null) {
            scores.add(scoreAgainstRange(value, range));
        }
    }

    private void addRangeScore(String key,
                               Double value,
                               Range range,
                               Map<String, Object> breakdown,
                               List<Double> scores) {
        if (value == null) {
            return;
        }
        double score = scoreAgainstRange(value, range);
        breakdown.put(key, round(score));
        scores.add(score);
    }

    private double scoreAgainstRange(double value, Range range) {
        if (value >= range.min() && value <= range.max()) {
            return 100.0;
        }
        double midpoint = (range.min() + range.max()) / 2.0;
        double span = Math.max((range.max() - range.min()) / 2.0, 1.0);
        double distance = Math.abs(value - midpoint);
        double penalty = Math.min(70.0, (distance / span) * 35.0);
        return Math.max(30.0, 100.0 - penalty);
    }

    private double scoreSoil(String soilType, List<String> preferredSoils) {
        if (soilType == null || soilType.isBlank() || preferredSoils == null || preferredSoils.isEmpty()) {
            return 60.0;
        }
        return preferredSoils.stream()
                .map(this::normalizeKey)
                .anyMatch(candidate -> candidate.equals(normalizeKey(soilType)))
                ? 95.0
                : 58.0;
    }

    private List<String> buildRecommendedActions(Map<String, Object> breakdown, CropProfile profile) {
        List<String> actions = new ArrayList<>();
        Object rainfallScore = breakdown.get("rainfall");
        Object temperatureScore = breakdown.get("temperature");
        Object phScore = breakdown.get("ph");

        if (rainfallScore instanceof Number number && number.doubleValue() < 70.0) {
            actions.add("Review irrigation coverage because rainfall suitability is below the ideal range.");
        }
        if (temperatureScore instanceof Number number && number.doubleValue() < 70.0) {
            actions.add("Adjust sowing window or protective practices to reduce temperature stress.");
        }
        if (phScore instanceof Number number && number.doubleValue() < 70.0) {
            actions.add("Correct soil pH with lime or gypsum based on lab recommendations.");
        }
        if (actions.isEmpty()) {
            actions.add("Current conditions are broadly aligned with the crop profile.");
        }
        actions.add("Monitor nutrient balance against the " + profile.label() + " benchmark profile.");
        return actions;
    }

    private Map<String, Object> buildCropRecommendationPayload(Map<String, Object> payload) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("N", firstNumber(payload, "N", "nitrogen"));
        request.put("P", firstNumber(payload, "P", "phosphorus"));
        request.put("K", firstNumber(payload, "K", "potassium"));
        request.put("temperature", firstNumber(payload, "temperature", "avgTemperature"));
        request.put("humidity", firstNumber(payload, "humidity"));
        request.put("rainfall", firstNumber(payload, "rainfall"));
        request.put("ph", firstNumber(payload, "ph", "soilPH"));
        return request;
    }

    private boolean hasRecommendationInputs(Map<String, Object> payload) {
        return firstNumber(payload, "N", "nitrogen") != null
                && firstNumber(payload, "P", "phosphorus") != null
                && firstNumber(payload, "K", "potassium") != null
                && firstNumber(payload, "temperature", "avgTemperature") != null
                && firstNumber(payload, "humidity") != null
                && firstNumber(payload, "rainfall") != null
                && firstNumber(payload, "ph", "soilPH") != null;
    }

    private String deriveRisk(double suitabilityScore) {
        if (suitabilityScore >= 80.0) {
            return "LOW";
        }
        if (suitabilityScore >= 60.0) {
            return "MEDIUM";
        }
        return "HIGH";
    }

    private String deriveEsgLabel(double score) {
        if (score >= 75.0) {
            return "Excellent";
        }
        if (score >= 50.0) {
            return "Medium";
        }
        return "Poor";
    }

    private double scoreWaterUsage(double waterUsage) {
        if (waterUsage <= 120000) {
            return 95.0;
        }
        if (waterUsage <= 180000) {
            return 80.0;
        }
        if (waterUsage <= 250000) {
            return 65.0;
        }
        if (waterUsage <= 320000) {
            return 50.0;
        }
        return 30.0;
    }

    private double scoreFertilizerType(String fertilizerType) {
        return switch (normalizeKey(fertilizerType)) {
            case "ORGANIC" -> 95.0;
            case "INTEGRATED" -> 78.0;
            default -> 40.0;
        };
    }

    private double scorePesticideLevel(String pesticideLevel) {
        return switch (normalizeKey(pesticideLevel)) {
            case "LOW" -> 90.0;
            case "MEDIUM" -> 65.0;
            default -> 35.0;
        };
    }

    private double average(double... values) {
        if (values.length == 0) {
            return 0.0;
        }

        double total = 0.0;
        for (double value : values) {
            total += value;
        }
        return total / values.length;
    }

    private double sumNumbers(Double... values) {
        double total = 0.0;
        for (Double value : values) {
            if (value != null) {
                total += value;
            }
        }
        return total;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double clamp(double value) {
        return Math.max(0.0, Math.min(100.0, value));
    }

    private String firstText(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (!text.isEmpty() && !"null".equalsIgnoreCase(text)) {
                return text;
            }
        }
        return null;
    }

    private Double firstNumber(Map<String, Object> payload, String... keys) {
        for (String key : keys) {
            Object value = payload.get(key);
            if (value == null) {
                continue;
            }
            if (value instanceof Number number) {
                return number.doubleValue();
            }
            try {
                String text = String.valueOf(value).trim();
                if (!text.isEmpty()) {
                    return Double.parseDouble(text);
                }
            } catch (NumberFormatException ignored) {
                // Ignore and continue.
            }
        }
        return null;
    }

    private int countDocuments(Object documentsObject) {
        if (documentsObject instanceof List<?> list) {
            return (int) list.stream().filter(Objects::nonNull).count();
        }
        return 0;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object input) {
        if (input instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, value) -> result.put(String.valueOf(key), value));
            return result;
        }
        return new LinkedHashMap<>();
    }

    private String normalizeKey(String value) {
        return value == null
                ? ""
                : value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
    }

    public record Range(double min, double max) {
    }

    public record CropProfile(
            String code,
            String label,
            List<String> aliases,
            List<String> preferredSoils,
            Range temperature,
            Range humidity,
            Range rainfall,
            Range ph,
            Range nitrogen,
            Range phosphorus,
            Range potassium,
            double yieldPerAcreQuintal,
            double pricePerQuintal,
            double costPerAcre,
            String waterUsageLevel
    ) {
    }
}
