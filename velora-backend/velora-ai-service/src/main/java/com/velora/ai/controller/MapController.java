package com.velora.ai.controller;

import com.velora.ai.dto.RouteRecommendationRequest;
import com.velora.ai.dto.RouteRecommendationResponse;
import com.velora.ai.service.AiService;
import com.velora.ai.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/map")
@Tag(name = "Map & Navigation", description = "Safe route navigation and geospatial safety routing")
public class MapController {
    private final AiService aiService;

    public MapController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/safe-route")
    @Operation(summary = "Get AI-powered safe route navigation")
    public ResponseEntity<ApiResponse<RouteRecommendationResponse>> getSafeRoute(@Valid @RequestBody RouteRecommendationRequest request) {
        RouteRecommendationResponse response = aiService.recommendRoute(request);
        return ResponseEntity.ok(ApiResponse.success("Safe route calculated using AI risk scoring", response));
    }
}
