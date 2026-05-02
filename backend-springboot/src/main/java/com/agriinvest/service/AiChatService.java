package com.agriinvest.service;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.agriinvest.dto.AiChatRequest;

@Service
public class AiChatService {

    private static final Pattern ACRE_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(acre|acres|ac)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern HECTARE_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(hectare|hectares|ha)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern TEMPERATURE_PATTERN = Pattern.compile(
            "(?:temp(?:erature)?|weather)\\s*(?:is|around|=)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:c|celsius|degree)?",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern HUMIDITY_PATTERN = Pattern.compile(
            "humidity\\s*(?:is|around|=)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern RAINFALL_PATTERN = Pattern.compile(
            "rainfall\\s*(?:is|around|=)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern PH_PATTERN = Pattern.compile(
            "(?:soil\\s*)?ph\\s*(?:is|around|=)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Map<String, String> SOIL_TYPES = Map.ofEntries(
            Map.entry("alluvial soil", "ALLUVIAL"),
            Map.entry("alluvial", "ALLUVIAL"),
            Map.entry("black soil", "BLACK"),
            Map.entry("black", "BLACK"),
            Map.entry("red soil", "RED"),
            Map.entry("red", "RED"),
            Map.entry("loamy soil", "LOAMY"),
            Map.entry("loam soil", "LOAMY"),
            Map.entry("loamy", "LOAMY"),
            Map.entry("loam", "LOAMY"),
            Map.entry("clay soil", "CLAY"),
            Map.entry("clay", "CLAY"),
            Map.entry("sandy soil", "SANDY"),
            Map.entry("sandy", "SANDY"),
            Map.entry("silty soil", "SILTY"),
            Map.entry("silty", "SILTY"),
            Map.entry("laterite soil", "LATERITE"),
            Map.entry("laterite", "LATERITE"),
            Map.entry("acidic soil", "ACIDIC"),
            Map.entry("acidic", "ACIDIC"),
            Map.entry("mountain soil", "MOUNTAIN"),
            Map.entry("mountain", "MOUNTAIN")
    );

    private static final Map<String, String> SOIL_LABELS = Map.ofEntries(
            Map.entry("ALLUVIAL", "Alluvial soil"),
            Map.entry("BLACK", "Black soil"),
            Map.entry("RED", "Red soil"),
            Map.entry("LOAMY", "Loamy soil"),
            Map.entry("CLAY", "Clay soil"),
            Map.entry("SANDY", "Sandy soil"),
            Map.entry("SILTY", "Silty soil"),
            Map.entry("LATERITE", "Laterite soil"),
            Map.entry("ACIDIC", "Acidic soil"),
            Map.entry("MOUNTAIN", "Mountain soil")
    );

    private static final Map<String, Set<String>> SEASONAL_CROPS = Map.of(
            "KHARIF", Set.of("RICE", "MAIZE", "BAJRA", "JOWAR", "ARHAR", "MOONG", "URAD", "COTTON", "GROUNDNUT", "SOYBEAN", "JUTE", "SUGARCANE"),
            "RABI", Set.of("WHEAT", "CHANA", "MASOOR", "MUSTARD", "POTATO", "CABBAGE", "ONION", "TOMATO"),
            "ZAID", Set.of("MAIZE", "MOONG", "URAD", "GROUNDNUT", "SUNFLOWER", "TOMATO", "ONION")
    );

    private static final Set<String> PERENNIAL_CROPS = Set.of("SUGARCANE", "TEA", "COFFEE", "MANGO", "BANANA", "POMEGRANATE", "GRAPES");

    private final ProjectInsightService projectInsightService;
    private final AiIntegrationService aiIntegrationService;
    private final Map<String, ConversationContext> sessions = new ConcurrentHashMap<>();

    public AiChatService(ProjectInsightService projectInsightService,
                         AiIntegrationService aiIntegrationService) {
        this.projectInsightService = projectInsightService;
        this.aiIntegrationService = aiIntegrationService;
    }

    public String getReply(AiChatRequest request) {
        String role = request == null ? null : request.getRole();
        String userId = request == null ? null : request.getUserId();
        String image = request == null ? null : request.getImage();
        String text = safeText(request == null ? null : request.getMessage());
        ConversationContext context = conversationContextFor(request, role, userId);

        if (isResetCommand(text)) {
            sessions.remove(sessionKey(userId, role));
            return "Sure. Starting fresh. Tell me crop, soil type, and season.";
        }

        if (image != null && !image.isBlank()) {
            return handleImageMessage(context, image, text);
        }

        if (text.isBlank()) {
            return "Tell me crop, soil type, season, or symptoms, and I will guide you.";
        }

        updateContext(context, text);
        return generateReply(text, role, context);
    }

    public String getReply(String message, String role, String userId, String image) {
        AiChatRequest request = new AiChatRequest();
        request.setMessage(message);
        request.setRole(role);
        request.setUserId(userId);
        request.setImage(image);
        return getReply(request);
    }

    public void resetConversation(String userId, String role) {
        sessions.remove(sessionKey(userId, role));
    }

    private ConversationContext conversationContextFor(AiChatRequest request, String role, String userId) {
        List<AiChatRequest.AiChatTurn> history = request == null || request.getHistory() == null
                ? List.of()
                : request.getHistory();
        String key = sessionKey(userId, role);

        if (history.isEmpty()) {
            return sessions.computeIfAbsent(key, ignored -> new ConversationContext());
        }

        ConversationContext context = new ConversationContext();
        int startIndex = Math.max(0, history.size() - 12);
        for (int index = startIndex; index < history.size(); index += 1) {
            AiChatRequest.AiChatTurn turn = history.get(index);
            if (turn == null || !"user".equalsIgnoreCase(safeText(turn.getSender()))) {
                continue;
            }

            String text = safeText(turn.getText());
            if (!text.isBlank()) {
                updateContext(context, text);
                context.lastIntent = detectIntent(text, context);
            }

            if (!safeText(turn.getImage()).isBlank()) {
                context.lastIntent = Intent.DISEASE_HELP;
            }
        }

        sessions.put(key, context);
        return context;
    }

    private String generateReply(String message, String role, ConversationContext context) {
        if (looksLikeGreeting(message) && context.isMostlyEmpty()) {
            context.lastIntent = Intent.NONE;
            return "Hi. Tell me your crop, soil type, season, or disease symptom.";
        }

        if (isPlatformQuestion(message, role)) {
            context.lastIntent = Intent.PLATFORM;
            return handlePlatformQuestion(message, role);
        }

        Intent intent = detectIntent(message, context);
        context.lastIntent = intent;

        return switch (intent) {
            case CROP_SUGGESTION -> handleCropSuggestion(context);
            case PROFIT_ANALYSIS -> handleProfitAnalysis(context);
            case DISEASE_HELP -> handleDiseaseAdvice(message, context);
            case SMART_TIPS -> handleSmartTips(context);
            case NONE, PLATFORM -> handleGeneralFallback(role, context);
        };
    }

    private Intent detectIntent(String message, ConversationContext context) {
        String lower = message.toLowerCase(Locale.ROOT);

        if (hasCropSuggestionKeywords(lower)) {
            return Intent.CROP_SUGGESTION;
        }
        if (hasDiseaseKeywords(lower) || hasSymptomKeywords(lower)) {
            return Intent.DISEASE_HELP;
        }
        if (hasProfitKeywords(lower) || looksLikeCropEconomicsQuestion(lower, context)) {
            return Intent.PROFIT_ANALYSIS;
        }
        if (hasTipsKeywords(lower)) {
            return Intent.SMART_TIPS;
        }

        if (context.lastIntent == Intent.CROP_SUGGESTION && hasCropSuggestionDetails(message, context)) {
            return Intent.CROP_SUGGESTION;
        }
        if (context.lastIntent == Intent.DISEASE_HELP
                && (hasSymptomKeywords(lower) || context.cropCode != null || looksLikeCropOnlyMessage(message))) {
            return Intent.DISEASE_HELP;
        }
        if (context.lastIntent == Intent.PROFIT_ANALYSIS
                && (context.cropCode != null || extractAcreage(message).isPresent())) {
            return Intent.PROFIT_ANALYSIS;
        }
        if (looksLikeCropOnlyMessage(message) && context.cropCode != null) {
            return Intent.PROFIT_ANALYSIS;
        }

        return Intent.NONE;
    }

    private String handleCropSuggestion(ConversationContext context) {
        if (context.soilCode == null && context.season == null) {
            return "Sure. Which soil type and season? If you know rainfall or temperature, send that too.";
        }
        if (context.soilCode == null) {
            return "Which soil type do you have? Example: black, red, loamy, or alluvial.";
        }
        if (context.season == null) {
            return "Which season are you planning for: Kharif, Rabi, or Zaid?";
        }

        List<CropSuggestion> suggestions = rankCropSuggestions(context);
        if (suggestions.isEmpty()) {
            return "I need one more detail to suggest a crop properly. Tell me rainfall or temperature if you know it.";
        }

        StringBuilder reply = new StringBuilder();
        reply.append("For ")
                .append(context.soilLabel == null ? "your soil" : context.soilLabel.toLowerCase(Locale.ROOT))
                .append(" in ")
                .append(displaySeason(context.season))
                .append(", good options are:\n");

        suggestions.stream()
                .limit(3)
                .forEach(item -> reply.append("- ")
                        .append(item.crop().label())
                        .append(": ")
                        .append(item.reason())
                        .append('\n'));

        reply.append("Tell me acres if you want a profit estimate.");
        return reply.toString().trim();
    }

    private List<CropSuggestion> rankCropSuggestions(ConversationContext context) {
        List<CropSuggestion> suggestions = new ArrayList<>();

        for (ProjectInsightService.CropProfile profile : projectInsightService.getCropProfiles()) {
            double score = 35.0;

            if (context.soilCode != null) {
                score += profile.preferredSoils().stream()
                        .anyMatch(soil -> normalize(soil).equals(normalize(context.soilCode)))
                        ? 28.0
                        : 8.0;
            }

            score += seasonScore(profile.code(), context.season);
            score += rangeScoreWeight(context.temperature, profile.temperature(), 0.15);
            score += rangeScoreWeight(context.rainfall, profile.rainfall(), 0.12);
            score += rangeScoreWeight(context.humidity, profile.humidity(), 0.08);
            score += rangeScoreWeight(context.ph, profile.ph(), 0.08);

            suggestions.add(new CropSuggestion(profile, score, buildCropSuggestionReason(profile, context)));
        }

        suggestions.sort((left, right) -> Double.compare(right.score(), left.score()));
        return suggestions;
    }

    private double seasonScore(String cropCode, String season) {
        if (season == null || season.isBlank()) {
            return 0.0;
        }
        if (PERENNIAL_CROPS.contains(cropCode)) {
            return 18.0;
        }
        if (SEASONAL_CROPS.getOrDefault(season, Set.of()).contains(cropCode)) {
            return 26.0;
        }
        return 4.0;
    }

    private String buildCropSuggestionReason(ProjectInsightService.CropProfile profile, ConversationContext context) {
        List<String> parts = new ArrayList<>();

        if (context.soilCode != null
                && profile.preferredSoils().stream().anyMatch(soil -> normalize(soil).equals(normalize(context.soilCode)))) {
            parts.add("strong soil fit");
        }

        if (SEASONAL_CROPS.getOrDefault(context.season, Set.of()).contains(profile.code())) {
            parts.add("good " + displaySeason(context.season) + " match");
        } else if (PERENNIAL_CROPS.contains(profile.code())) {
            parts.add("works as a long-term crop");
        }

        parts.add(profile.waterUsageLevel().toLowerCase(Locale.ROOT) + " water need");
        parts.add("cost ~" + formatRupees(profile.costPerAcre()) + "/acre");

        return String.join(", ", parts);
    }

    private String handleProfitAnalysis(ConversationContext context) {
        Optional<ProjectInsightService.CropProfile> profileOptional = resolveCurrentCrop(context);
        if (profileOptional.isEmpty()) {
            return "Which crop do you want cost and ROI for?";
        }

        ProjectInsightService.CropProfile profile = profileOptional.get();
        double acres = context.acres != null && context.acres > 0 ? context.acres : 1.0;
        boolean useAdjustedEstimate = hasEnoughProfitInputs(context);

        double costEstimate;
        double revenueEstimate;
        double profitEstimate;
        String riskLevel = null;

        if (useAdjustedEstimate) {
            Map<String, Object> analysisPayload = new LinkedHashMap<>();
            analysisPayload.put("cropType", profile.code());
            analysisPayload.put("acres", acres);
            analysisPayload.put("soilType", context.soilCode);
            analysisPayload.put("temperature", context.temperature);
            analysisPayload.put("humidity", context.humidity);
            analysisPayload.put("rainfall", context.rainfall);
            analysisPayload.put("ph", context.ph);

            Map<String, Object> result = projectInsightService.analyzeCrop(analysisPayload);
            costEstimate = numberValue(result.get("costEstimate"), profile.costPerAcre() * acres);
            revenueEstimate = numberValue(result.get("revenueEstimate"), profile.yieldPerAcreQuintal() * profile.pricePerQuintal() * acres);
            profitEstimate = numberValue(result.get("profitEstimate"), revenueEstimate - costEstimate);
            riskLevel = String.valueOf(result.getOrDefault("riskLevel", ""));
        } else {
            costEstimate = profile.costPerAcre() * acres;
            revenueEstimate = profile.yieldPerAcreQuintal() * profile.pricePerQuintal() * acres;
            profitEstimate = revenueEstimate - costEstimate;
        }

        double roi = costEstimate <= 0 ? 0.0 : (profitEstimate / costEstimate) * 100.0;
        StringBuilder reply = new StringBuilder();

        if (context.acres != null && context.acres > 0) {
            reply.append("For ").append(formatNumber(acres)).append(" acres of ").append(profile.label()).append(":\n");
        } else {
            reply.append(profile.label()).append(" looks profitable on a good acre.\n");
        }

        if (acres == 1.0 && (context.acres == null || context.acres <= 0)) {
            reply.append("- Cost: ~").append(formatRupees(costEstimate)).append("/acre\n");
            reply.append("- Revenue: ~").append(formatRupees(revenueEstimate)).append("/acre\n");
            reply.append("- Profit: ~").append(formatRupees(profitEstimate)).append("/acre\n");
        } else {
            reply.append("- Cost: ~").append(formatRupees(costEstimate)).append('\n');
            reply.append("- Revenue: ~").append(formatRupees(revenueEstimate)).append('\n');
            reply.append("- Profit: ~").append(formatRupees(profitEstimate)).append('\n');
        }

        reply.append("- ROI: ~").append(Math.round(roi)).append("%\n");

        if (riskLevel != null && !riskLevel.isBlank()) {
            reply.append("- Risk: ").append(riskLevel).append('\n');
        }

        reply.append("Best range: ")
                .append(formatNumber(profile.temperature().min()))
                .append("-")
                .append(formatNumber(profile.temperature().max()))
                .append(" C.");

        if (!useAdjustedEstimate) {
            reply.append("\nShare soil type or season if you want a tighter estimate.");
        }

        return reply.toString().trim();
    }

    private String handleDiseaseAdvice(String message, ConversationContext context) {
        String combinedSymptoms = combineSymptoms(message, context.symptomText);

        if (context.cropCode == null && !mentionsNamedDisease(combinedSymptoms)) {
            return "Which crop is affected? Tell me crop name plus the main symptom, like yellow leaves, spots, curling, or wilting.";
        }

        DiseaseAdvice advice = detectDiseaseAdvice(context.cropCode, combinedSymptoms);
        if (advice == null) {
            String cropLabel = context.cropName == null ? "the crop" : context.cropName;
            return "I need one more clue for " + cropLabel + ". Do you see spots, leaf curl, wilting, insects, or white powder?";
        }

        return buildDiseaseReply(context.cropName, advice);
    }

    private DiseaseAdvice detectDiseaseAdvice(String cropCode, String text) {
        String lower = text.toLowerCase(Locale.ROOT);

        if ((isCrop(cropCode, "TOMATO")
                && ((hasAny(lower, "yellow") && hasAny(lower, "curl", "curled"))
                || hasAny(lower, "whitefly", "leaf curl", "yellow leaf curl")))
                || hasAny(lower, "leaf curl", "yellow leaf curl")) {
            return new DiseaseAdvice(
                    "yellow curling leaves often point to leaf curl or whitefly stress.",
                    "spray neem oil 3-5 ml/L, use yellow sticky traps, and remove badly affected leaves",
                    "use imidacloprid or thiamethoxam as per label if whitefly pressure is high",
                    "Check if the plant is also stunted."
            );
        }

        if ((isCrop(cropCode, "TOMATO", "POTATO") && hasAny(lower, "late blight", "water soaked", "black patch", "dark patch"))
                || hasAny(lower, "late blight")) {
            return new DiseaseAdvice(
                    "this could be late blight.",
                    "remove infected leaves, improve airflow, and avoid late-evening irrigation",
                    "spray mancozeb, chlorothalonil, or another label-approved blight fungicide",
                    "If rain has started, act quickly because blight spreads fast."
            );
        }

        if ((isCrop(cropCode, "TOMATO", "POTATO") && hasAny(lower, "brown spot", "leaf spot", "target spot", "concentric"))
                || hasAny(lower, "early blight")) {
            return new DiseaseAdvice(
                    "this looks close to early blight or fungal leaf spot.",
                    "remove lower infected leaves, mulch the base, and keep leaves dry",
                    "use copper oxychloride or mancozeb as per label schedule",
                    "Are the spots ring-shaped or spreading upward?"
            );
        }

        if (hasAny(lower, "white powder", "powdery", "powdery mildew")) {
            return new DiseaseAdvice(
                    "this sounds like powdery mildew.",
                    "spray diluted cow milk or potassium bicarbonate and improve airflow",
                    "use wettable sulphur or another label-approved mildew fungicide",
                    "Do not spray in peak afternoon heat."
            );
        }

        if ((isCrop(cropCode, "MAIZE", "WHEAT") && hasAny(lower, "rust", "orange pustule", "orange spots"))
                || hasAny(lower, "rust")) {
            return new DiseaseAdvice(
                    "this could be rust disease.",
                    "remove heavily affected leaves and reduce dense canopy humidity",
                    "spray a triazole fungicide as per label if spread is active",
                    "Check whether the orange spots are mostly on older leaves."
            );
        }

        if (hasAny(lower, "yellow leaf", "yellow leaves", "chlorosis")) {
            return new DiseaseAdvice(
                    "yellow leaves often mean nutrient stress, waterlogging, or an early disease start.",
                    "add compost or vermicompost and improve drainage first",
                    "use a balanced nutrient spray or nitrogen correction only at recommended dose",
                    "Tell me whether yellowing starts from old leaves or new leaves."
            );
        }

        if (hasAny(lower, "wilt", "wilting", "drooping", "sudden dry")) {
            return new DiseaseAdvice(
                    "this could be wilt, root stress, or a watering problem.",
                    "check root-zone moisture, remove badly affected plants, and add organic matter",
                    "if wilt is spreading plant to plant, use a suitable soil fungicide or bactericide only after field confirmation",
                    "Is the soil too wet or too dry right now?"
            );
        }

        if (hasAny(lower, "holes", "chewed", "caterpillar", "armyworm")) {
            return new DiseaseAdvice(
                    "this looks more like a leaf-eating pest attack.",
                    "hand-pick larvae early, use pheromone traps, and spray neem-based product",
                    "use emamectin benzoate or spinosad as per label when damage crosses threshold",
                    "Check the underside of leaves in the evening."
            );
        }

        if (hasAny(lower, "aphid", "whitefly", "jassid", "sticky")) {
            return new DiseaseAdvice(
                    "this looks like a sucking pest problem.",
                    "use neem oil, sticky traps, and remove weed hosts around the crop",
                    "use a label-approved systemic insecticide if infestation is increasing",
                    "Look at the underside of the leaves for insects."
            );
        }

        return null;
    }

    private String buildDiseaseReply(String cropName, DiseaseAdvice advice) {
        String prefix = cropName == null || cropName.isBlank()
                ? "This issue"
                : cropName + ":";

        return prefix + " " + advice.summary() + "\n"
                + "Organic: " + advice.organicStep() + ".\n"
                + "Chemical: " + advice.chemicalStep() + ".\n"
                + advice.followUp();
    }

    private String handleSmartTips(ConversationContext context) {
        Optional<ProjectInsightService.CropProfile> profile = resolveCurrentCrop(context);

        if (profile.isPresent()) {
            ProjectInsightService.CropProfile crop = profile.get();
            return crop.label() + " smart tips:\n"
                    + "- Use drip or morning irrigation to reduce disease pressure.\n"
                    + "- Split fertilizer dose instead of one heavy application.\n"
                    + "- Scout twice a week, especially after rain or humidity spikes.";
        }

        return "Quick smart farming tips:\n"
                + "- Test soil before sowing so fertilizer is not guesswork.\n"
                + "- Prefer drip or early-morning irrigation to save water.\n"
                + "- Scout the field twice a week and act early on pests.";
    }

    private String handleGeneralFallback(String role, ConversationContext context) {
        if ("INVESTOR".equalsIgnoreCase(role)) {
            return "I can help with crop profitability, project ROI, risk, and investor returns. Ask about any crop or project.";
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return "I can help with farmer crop queries, project screening, risk, and approval logic. Ask me a specific case.";
        }
        if ("AGRI_PARTNER".equalsIgnoreCase(role)) {
            return "I can help with crop issues, field tips, work logs, and payout flow. Tell me the crop or task.";
        }
        if (context.cropName != null) {
            return "I can help with " + context.cropName + " profit, disease guidance, and field tips. What do you want to check?";
        }
        return "I can suggest crops, estimate farming ROI, guide disease treatment, and share practical farming tips.";
    }

    private boolean isPlatformQuestion(String message, String role) {
        String lower = message.toLowerCase(Locale.ROOT);
        return hasAny(lower, "project", "withdraw", "withdrawal", "milestone", "approval", "approve", "reject",
                "payment", "disbursal", "disbursement", "wallet", "investor return", "esg", "work log", "payout")
                && !hasAny(lower, "crop suggestion", "suggest crop", "soil", "season", "disease", "blight", "mildew",
                "yellow leaves", "spots", "wilt", "farming", "acre", "acres", "profit per acre");
    }

    private String handlePlatformQuestion(String message, String role) {
        String lower = message.toLowerCase(Locale.ROOT);

        if (hasAny(lower, "withdraw", "withdrawal")) {
            return "Farmer withdrawal needs amount, reason, and milestone proof. Admin should verify before release.";
        }
        if (hasAny(lower, "milestone")) {
            return "Keep milestones simple: land prep, sowing, irrigation, fertilizer, pest control, harvest, and sale update.";
        }
        if (hasAny(lower, "approve", "approval")) {
            return "Approve only after land proof, crop plan, funding need, water access, and basic feasibility are checked.";
        }
        if (hasAny(lower, "reject")) {
            return "Give a clear rejection reason like missing proof, unrealistic budget, weak crop plan, or water risk.";
        }
        if ("INVESTOR".equalsIgnoreCase(role) && hasAny(lower, "roi", "return", "investor return")) {
            return "Investor returns come from project net profit after expenses and platform deductions are settled.";
        }
        if ("AGRI_PARTNER".equalsIgnoreCase(role) && hasAny(lower, "payout", "work log")) {
            return "Agri-partners should submit work logs with proof first. Payout can be released after admin verification.";
        }

        return "I can help with funding flow, milestones, approval checks, payouts, and crop-related project risk.";
    }

    private String handleImageMessage(ConversationContext context, String image, String text) {
        try {
            DecodedImage decodedImage = decodeImage(image);
            Map<String, Object> result = aiIntegrationService.predictDisease(decodedImage.bytes(), decodedImage.filename());
            String crop = textValue(result.get("crop"));
            String disease = textValue(result.get("disease"));
            double confidence = numberValue(result.get("confidence"), 0.0);

            if (!crop.isBlank()) {
                projectInsightService.getCropProfile(crop).ifPresent(profile -> {
                    context.cropCode = profile.code();
                    context.cropName = profile.label();
                });
            }

            if (disease.toLowerCase(Locale.ROOT).contains("healthy")) {
                return crop + " looks healthy (" + Math.round(confidence) + "% confidence).\n"
                        + "Keep scouting every 5 to 7 days and avoid unnecessary spray.";
            }

            DiseaseAdvice advice = detectDiseaseAdvice(context.cropCode, disease);
            if (advice != null) {
                return crop + ": " + disease + " looks likely (" + Math.round(confidence) + "% confidence).\n"
                        + "Organic: " + advice.organicStep() + ".\n"
                        + "Chemical: " + advice.chemicalStep() + ".\n"
                        + advice.followUp();
            }

            List<String> treatment = toStringList(result.get("treatment"));
            List<String> prevention = toStringList(result.get("prevention"));

            StringBuilder reply = new StringBuilder();
            reply.append(crop).append(": ").append(disease).append(" looks likely (")
                    .append(Math.round(confidence)).append("% confidence).\n");
            if (!treatment.isEmpty()) {
                reply.append("Quick treatment: ").append(treatment.get(0)).append(".\n");
            }
            if (!prevention.isEmpty()) {
                reply.append("Prevention: ").append(prevention.get(0)).append(".");
            }
            return reply.toString().trim();
        } catch (RuntimeException exception) {
            return "I got the image, but I could not analyze it right now. Tell me crop + symptoms and I will still guide you.";
        }
    }

    private void updateContext(ConversationContext context, String message) {
        extractCropProfile(message).ifPresent(profile -> {
            context.cropCode = profile.code();
            context.cropName = profile.label();
        });

        extractSoilCode(message).ifPresent(soilCode -> {
            context.soilCode = soilCode;
            context.soilLabel = SOIL_LABELS.getOrDefault(soilCode, soilCode);
        });

        extractSeason(message).ifPresent(season -> context.season = season);
        extractAcreage(message).ifPresent(acres -> context.acres = acres);
        extractNumber(TEMPERATURE_PATTERN, message).ifPresent(value -> context.temperature = value);
        extractNumber(HUMIDITY_PATTERN, message).ifPresent(value -> context.humidity = value);
        extractNumber(RAINFALL_PATTERN, message).ifPresent(value -> context.rainfall = value);
        extractNumber(PH_PATTERN, message).ifPresent(value -> context.ph = value);

        if (hasDiseaseKeywords(message.toLowerCase(Locale.ROOT)) || hasSymptomKeywords(message.toLowerCase(Locale.ROOT))) {
            context.symptomText = combineSymptoms(message, context.symptomText);
        }
    }

    private Optional<ProjectInsightService.CropProfile> extractCropProfile(String message) {
        String lower = " " + message.toLowerCase(Locale.ROOT) + " ";

        for (ProjectInsightService.CropProfile profile : projectInsightService.getCropProfiles()) {
            List<String> names = new ArrayList<>();
            names.add(profile.label());
            names.add(profile.code());
            if (profile.aliases() != null) {
                names.addAll(profile.aliases());
            }

            names.sort((left, right) -> Integer.compare(right.length(), left.length()));
            for (String name : names) {
                Pattern pattern = Pattern.compile("\\b" + Pattern.quote(name.toLowerCase(Locale.ROOT)) + "\\b");
                if (pattern.matcher(lower).find()) {
                    return Optional.of(profile);
                }
            }
        }

        return Optional.empty();
    }

    private Optional<String> extractSoilCode(String message) {
        String lower = " " + message.toLowerCase(Locale.ROOT) + " ";
        return SOIL_TYPES.entrySet().stream()
                .sorted((left, right) -> Integer.compare(right.getKey().length(), left.getKey().length()))
                .filter(entry -> lower.contains(" " + entry.getKey().toLowerCase(Locale.ROOT) + " "))
                .map(Map.Entry::getValue)
                .findFirst();
    }

    private Optional<String> extractSeason(String message) {
        String lower = message.toLowerCase(Locale.ROOT);
        if (hasAny(lower, "kharif", "monsoon")) {
            return Optional.of("KHARIF");
        }
        if (hasAny(lower, "rabi", "winter")) {
            return Optional.of("RABI");
        }
        if (hasAny(lower, "zaid", "summer")) {
            return Optional.of("ZAID");
        }
        return Optional.empty();
    }

    private Optional<Double> extractAcreage(String message) {
        Matcher acreMatcher = ACRE_PATTERN.matcher(message);
        if (acreMatcher.find()) {
            return Optional.of(Double.parseDouble(acreMatcher.group(1)));
        }

        Matcher hectareMatcher = HECTARE_PATTERN.matcher(message);
        if (hectareMatcher.find()) {
            return Optional.of(Double.parseDouble(hectareMatcher.group(1)) * 2.47105);
        }

        return Optional.empty();
    }

    private Optional<Double> extractNumber(Pattern pattern, String message) {
        Matcher matcher = pattern.matcher(message);
        if (matcher.find()) {
            return Optional.of(Double.parseDouble(matcher.group(1)));
        }
        return Optional.empty();
    }

    private Optional<ProjectInsightService.CropProfile> resolveCurrentCrop(ConversationContext context) {
        if (context.cropCode == null) {
            return Optional.empty();
        }
        return projectInsightService.getCropProfile(context.cropCode);
    }

    private boolean hasEnoughProfitInputs(ConversationContext context) {
        int count = 0;
        if (context.soilCode != null) {
            count++;
        }
        if (context.temperature != null) {
            count++;
        }
        if (context.rainfall != null) {
            count++;
        }
        if (context.humidity != null) {
            count++;
        }
        if (context.ph != null) {
            count++;
        }
        return count >= 2;
    }

    private boolean hasCropSuggestionDetails(String message, ConversationContext context) {
        return extractSoilCode(message).isPresent()
                || extractSeason(message).isPresent()
                || extractNumber(TEMPERATURE_PATTERN, message).isPresent()
                || extractNumber(RAINFALL_PATTERN, message).isPresent()
                || context.soilCode != null
                || context.season != null;
    }

    private boolean looksLikeCropEconomicsQuestion(String lower, ConversationContext context) {
        return hasAny(lower, "farming", "cultivation", "profit", "cost", "roi", "returns", "revenue", "income", "margin")
                || (context.cropCode != null && hasAny(lower, "how much", "worth it", "return"));
    }

    private boolean looksLikeCropOnlyMessage(String message) {
        return extractCropProfile(message).isPresent() && message.trim().split("\\s+").length <= 3;
    }

    private boolean hasCropSuggestionKeywords(String lower) {
        return hasAny(lower, "suggest crop", "recommend crop", "which crop", "what crop", "best crop", "crop suggestion", "suitable crop");
    }

    private boolean hasProfitKeywords(String lower) {
        return hasAny(lower, "profit", "cost", "roi", "returns", "revenue", "income", "margin");
    }

    private boolean hasDiseaseKeywords(String lower) {
        return hasAny(lower, "disease", "infection", "infected", "pest", "fungus", "fungal", "virus", "viral", "bacteria", "bacterial");
    }

    private boolean hasSymptomKeywords(String lower) {
        return hasAny(lower, "yellow", "spots", "spot", "curl", "curled", "wilt", "wilting", "powder", "rust", "holes",
                "chewed", "sticky", "whitefly", "aphid", "blight", "mildew", "mosaic", "drooping", "stunted");
    }

    private boolean hasTipsKeywords(String lower) {
        return hasAny(lower, "tips", "tip", "irrigation", "fertilizer", "farming advice", "smart farming", "water saving");
    }

    private boolean looksLikeGreeting(String message) {
        return hasAny(message.toLowerCase(Locale.ROOT), "hi", "hello", "hey", "good morning", "good evening");
    }

    private boolean mentionsNamedDisease(String text) {
        return hasAny(text.toLowerCase(Locale.ROOT), "blight", "mildew", "rust", "mosaic", "leaf curl");
    }

    private boolean isResetCommand(String text) {
        return hasAny(text.toLowerCase(Locale.ROOT), "reset chat", "clear chat", "new chat", "start over");
    }

    private boolean hasAny(String input, String... keywords) {
        for (String keyword : keywords) {
            if (input.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean isCrop(String cropCode, String... options) {
        if (cropCode == null) {
            return false;
        }
        for (String option : options) {
            if (option.equalsIgnoreCase(cropCode)) {
                return true;
            }
        }
        return false;
    }

    private String combineSymptoms(String latestMessage, String existingSymptoms) {
        if (existingSymptoms == null || existingSymptoms.isBlank()) {
            return latestMessage;
        }
        String lowerLatest = latestMessage.toLowerCase(Locale.ROOT);
        if (existingSymptoms.toLowerCase(Locale.ROOT).contains(lowerLatest)) {
            return existingSymptoms;
        }
        return existingSymptoms + ". " + latestMessage;
    }

    private double rangeScoreWeight(Double value, ProjectInsightService.Range range, double weight) {
        if (value == null || range == null) {
            return 0.0;
        }

        double score;
        if (value >= range.min() && value <= range.max()) {
            score = 100.0;
        } else {
            double midpoint = (range.min() + range.max()) / 2.0;
            double span = Math.max((range.max() - range.min()) / 2.0, 1.0);
            double distance = Math.abs(value - midpoint);
            double penalty = Math.min(70.0, (distance / span) * 35.0);
            score = Math.max(30.0, 100.0 - penalty);
        }

        return score * weight;
    }

    private String normalize(String value) {
        return value == null
                ? ""
                : value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "");
    }

    private String formatRupees(double amount) {
        double absolute = Math.abs(amount);
        if (absolute >= 10_000_000) {
            return "Rs " + formatOneDecimal(amount / 10_000_000) + " crore";
        }
        if (absolute >= 100_000) {
            return "Rs " + formatOneDecimal(amount / 100_000) + " lakh";
        }

        NumberFormat formatter = NumberFormat.getNumberInstance(new Locale("en", "IN"));
        formatter.setMaximumFractionDigits(0);
        return "Rs " + formatter.format(Math.round(amount));
    }

    private String formatOneDecimal(double value) {
        double rounded = Math.round(value * 10.0) / 10.0;
        if (Math.abs(rounded - Math.rint(rounded)) < 0.0001) {
            return String.valueOf((long) rounded);
        }
        return String.valueOf(rounded);
    }

    private String formatNumber(double value) {
        double rounded = Math.round(value * 100.0) / 100.0;
        if (Math.abs(rounded - Math.rint(rounded)) < 0.0001) {
            return String.valueOf((long) rounded);
        }
        return String.valueOf(rounded);
    }

    private String displaySeason(String season) {
        return switch (season) {
            case "KHARIF" -> "Kharif";
            case "RABI" -> "Rabi";
            case "ZAID" -> "Zaid";
            default -> season;
        };
    }

    private String textValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private double numberValue(Object value, double fallback) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value != null) {
            try {
                return Double.parseDouble(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private List<String> toStringList(Object value) {
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of();
    }

    private DecodedImage decodeImage(String imageData) {
        String[] parts = imageData.split(",", 2);
        String metadata = parts.length > 1 ? parts[0] : "";
        String encoded = parts.length > 1 ? parts[1] : parts[0];
        String filename = metadata.contains("png") ? "chat-leaf.png" : "chat-leaf.jpg";
        return new DecodedImage(Base64.getDecoder().decode(encoded), filename);
    }

    private String sessionKey(String userId, String role) {
        String safeUserId = userId == null || userId.isBlank() ? "guest" : userId.trim();
        String safeRole = role == null || role.isBlank() ? "FARMER" : role.trim().toUpperCase(Locale.ROOT);
        return safeUserId + "::" + safeRole;
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    private enum Intent {
        NONE,
        CROP_SUGGESTION,
        PROFIT_ANALYSIS,
        DISEASE_HELP,
        SMART_TIPS,
        PLATFORM
    }

    private static final class ConversationContext {
        private String cropCode;
        private String cropName;
        private String soilCode;
        private String soilLabel;
        private String season;
        private Double acres;
        private Double temperature;
        private Double humidity;
        private Double rainfall;
        private Double ph;
        private String symptomText;
        private Intent lastIntent = Intent.NONE;

        private boolean isMostlyEmpty() {
            return cropCode == null
                    && soilCode == null
                    && season == null
                    && acres == null
                    && symptomText == null;
        }
    }

    private record CropSuggestion(ProjectInsightService.CropProfile crop, double score, String reason) {
    }

    private record DiseaseAdvice(String summary, String organicStep, String chemicalStep, String followUp) {
    }

    private record DecodedImage(byte[] bytes, String filename) {
    }
}
