package com.velora.ai.service;

import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.velora.ai.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${velora.gemini.api-key:${velora.openai.api-key:}}")
    private String geminiApiKey;

    @Value("${velora.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
    private static final String SYSTEM_PROMPT = """
        You are Velora AI, an intelligent 24/7 Women's Safety Assistant. Your mission is to:
        1. Provide immediate safety guidance, crisis support, and emergency instructions for women.
        2. Suggest safe travel precautions, route recommendations, and risk reduction tactics.
        3. Explain Velora SOS features (distress dispatch to 112 National Emergency Helpline and 100 Police Control Room).
        4. Give clear, empathetic, and actionable advice.
        5. If someone is in immediate danger, emphasize pressing the SOS button or calling 112 / 100 immediately.
        """;

    public AiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClientBuilder = webClientBuilder;
        this.objectMapper = objectMapper;
    }

    public AiChatResponse chat(AiChatRequest request, Long userId) {
        String promptText = SYSTEM_PROMPT + "\n\nUser Question: " + request.getMessage();

        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                Map<String, Object> part = Map.of("text", promptText);
                Map<String, Object> contentMap = Map.of("parts", List.of(part));
                Map<String, Object> requestBody = Map.of("contents", List.of(contentMap));

                String url = String.format("%s/%s:generateContent?key=%s", GEMINI_BASE_URL, geminiModel, geminiApiKey);

                String responseJson = webClientBuilder.build().post()
                        .uri(url)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .block();

                JsonNode root = objectMapper.readTree(responseJson);
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && candidates.size() > 0) {
                    String content = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                    if (content != null && !content.isBlank()) {
                        return AiChatResponse.builder()
                                .message(content)
                                .model(geminiModel)
                                .tokensUsed(150)
                                .fallback(false)
                                .build();
                    }
                }
            } catch (Exception e) {
                log.error("Google Gemini AI API error: {}", e.getMessage());
            }
        }

        return fallbackChatResponse(request.getMessage());
    }

    public RiskPredictionResponse predictRisk(RiskPredictionRequest request) {
        double riskScore = computeRiskScore(request);
        String riskLevel = getRiskLevel(riskScore);
        List<String> factors = analyzeRiskFactors(request);
        List<String> tips = generateSafetyTips(riskLevel, request);

        return RiskPredictionResponse.builder()
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .riskLabel(getRiskLabel(riskLevel))
                .riskFactors(factors)
                .safetyTips(tips)
                .recommendation(generateRiskRecommendation(riskLevel))
                .build();
    }

    public RouteRecommendationResponse recommendRoute(RouteRecommendationRequest request) {
        double distanceKm = computeApproxDistance(request.getOriginLat(), request.getOriginLon(), request.getDestinationLat(), request.getDestinationLon());
        double safetyScore = computeRouteSafetyScore(request);
        String estimatedTime = estimateTime(distanceKm, request.getPreference());
        List<String> concerns = new ArrayList<>();
        List<String> tips = new ArrayList<>();

        if ("night".equalsIgnoreCase(getTimeOfDay())) {
            concerns.add("Night travel increases risk");
            tips.add("Share your live location with a trusted contact before starting your journey");
        }
        if (distanceKm > 10) {
            tips.add("Take breaks in well-lit public areas");
        }
        tips.add("Keep emergency contacts on speed dial");
        tips.add("Stay on main roads and avoid isolated shortcuts");

        return RouteRecommendationResponse.builder()
                .preferredRoute("safest".equals(request.getPreference()) ? "safest" : "balanced")
                .safetyScore(safetyScore)
                .estimatedTime(estimatedTime)
                .estimatedDistanceKm(distanceKm)
                .safetyConcerns(concerns)
                .safetyTips(tips)
                .recommendation("Travel during daylight hours on well-lit, populated routes.")
                .waypoints(List.of(
                        new RouteRecommendationResponse.RoutePoint(request.getOriginLat(), request.getOriginLon(), "Start"),
                        new RouteRecommendationResponse.RoutePoint(request.getDestinationLat(), request.getDestinationLon(), "Destination")
                ))
                .build();
    }

    private List<Map<String, String>> buildMessageList(AiChatRequest request) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        if (request.getHistory() != null) {
            for (AiChatRequest.ChatMessage h : request.getHistory()) {
                messages.add(Map.of("role", h.getRole(), "content", h.getContent()));
            }
        }
        String userMessage = request.getMessage();
        if (request.getUserLatitude() != null && request.getUserLongitude() != null) {
            userMessage += " [User location: " + request.getUserLatitude() + ", " + request.getUserLongitude() + "]";
        }
        messages.add(Map.of("role", "user", "content", userMessage));
        return messages;
    }

    private AiChatResponse fallbackChatResponse(String message) {
        String lowerMessage = message.toLowerCase();
        String response;
        if (lowerMessage.contains("help") || lowerMessage.contains("danger") || lowerMessage.contains("emergency")) {
            response = "⚠️ If you are in immediate danger, please call **112** (Emergency) or **1091** (Women's Helpline) right away. Your safety is the priority. If you can, move to a public, well-lit area or enter the nearest shop/building.";
        } else if (lowerMessage.contains("route") || lowerMessage.contains("travel") || lowerMessage.contains("safe")) {
            response = "🗺️ For safe travel: (1) Plan your route beforehand and share it with a trusted contact. (2) Prefer well-lit, busy roads especially at night. (3) Use Velora's Safe Route feature to find the lowest-risk path. (4) Keep your phone charged.";
        } else if (lowerMessage.contains("sos") || lowerMessage.contains("alert")) {
            response = "🚨 Use the SOS button in the Velora app to instantly alert your emergency contacts and nearby police. Your location will be shared automatically.";
        } else {
            response = "🛡️ I'm Velora, your AI safety assistant. I can help you with: safe route planning, emergency guidance, incident reporting, and personal safety tips. How can I help you stay safe today?";
        }
        return AiChatResponse.builder()
                .message(response)
                .model("velora-fallback")
                .tokensUsed(0)
                .fallback(true)
                .build();
    }

    private double computeRiskScore(RiskPredictionRequest req) {
        double score = 30.0;
        if ("night".equalsIgnoreCase(req.getTimeOfDay())) score += 25;
        else if ("evening".equalsIgnoreCase(req.getTimeOfDay())) score += 15;
        score += Math.min(req.getNearbyIncidentCount() * 5, 30);
        if ("rain".equalsIgnoreCase(req.getWeatherCondition())) score += 5;
        if ("fog".equalsIgnoreCase(req.getWeatherCondition())) score += 8;
        return Math.min(score, 100.0);
    }

    private String getRiskLevel(double score) {
        if (score < 30) return "LOW";
        if (score < 55) return "MEDIUM";
        if (score < 75) return "HIGH";
        return "CRITICAL";
    }

    private String getRiskLabel(String level) {
        return switch (level) {
            case "LOW" -> "Safe Area";
            case "MEDIUM" -> "Moderate Caution";
            case "HIGH" -> "High Risk - Stay Alert";
            case "CRITICAL" -> "Critical Risk - Seek Help Immediately";
            default -> "Unknown";
        };
    }

    private List<String> analyzeRiskFactors(RiskPredictionRequest req) {
        List<String> factors = new ArrayList<>();
        if ("night".equalsIgnoreCase(req.getTimeOfDay())) factors.add("Night-time travel (increased risk)");
        if (req.getNearbyIncidentCount() > 3) factors.add(req.getNearbyIncidentCount() + " recent incidents in this area");
        if (!"clear".equalsIgnoreCase(req.getWeatherCondition())) factors.add("Poor weather: " + req.getWeatherCondition());
        if (factors.isEmpty()) factors.add("No significant risk factors detected");
        return factors;
    }

    private List<String> generateSafetyTips(String level, RiskPredictionRequest req) {
        List<String> tips = new ArrayList<>();
        tips.add("Share your location with a trusted contact");
        tips.add("Keep emergency contacts on speed dial");
        if ("HIGH".equals(level) || "CRITICAL".equals(level)) {
            tips.add("Avoid this area if possible");
            tips.add("If you must travel here, do so in a group");
            tips.add("Consider using a ride-sharing service instead of walking");
        }
        if ("night".equalsIgnoreCase(req.getTimeOfDay())) {
            tips.add("Carry a personal alarm or whistle");
        }
        return tips;
    }

    private String generateRiskRecommendation(String level) {
        return switch (level) {
            case "LOW" -> "Area appears safe. Take standard precautions.";
            case "MEDIUM" -> "Moderate risk. Stay aware of your surroundings and keep contacts informed.";
            case "HIGH" -> "High risk area. Consider an alternative route or travel with company.";
            case "CRITICAL" -> "Critical risk. Seek immediate help or avoid this area entirely.";
            default -> "Stay aware of your surroundings.";
        };
    }

    private double computeApproxDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double computeRouteSafetyScore(RouteRecommendationRequest req) {
        return "safest".equals(req.getPreference()) ? 85.0 : 72.0;
    }

    private String estimateTime(double distanceKm, String preference) {
        double speedKmh = "fastest".equals(preference) ? 40.0 : 25.0;
        double hours = distanceKm / speedKmh;
        int minutes = (int) (hours * 60);
        if (minutes < 1) return "< 1 min";
        if (minutes < 60) return minutes + " min";
        return (minutes / 60) + " hr " + (minutes % 60) + " min";
    }

    private String getTimeOfDay() {
        int hour = LocalDateTime.now().getHour();
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >= 17 && hour < 21) return "evening";
        return "night";
    }

    private boolean isGeminiConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.equals("YOUR_KEY_HERE");
    }
}
