package com.velora.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    private Mono<ResponseEntity<Map<String, Object>>> serviceUnavailable(String service) {
        return Mono.just(ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                        "success", false,
                        "message", service + " is temporarily unavailable. Please make sure the service is running.",
                        "timestamp", LocalDateTime.now().toString(),
                        "status", 503
                )));
    }

    @RequestMapping("/auth")
    public Mono<ResponseEntity<Map<String, Object>>> authFallback() {
        return serviceUnavailable("Auth Service");
    }

    @RequestMapping("/user")
    public Mono<ResponseEntity<Map<String, Object>>> userFallback() {
        return serviceUnavailable("User Service");
    }

    @RequestMapping("/safety")
    public Mono<ResponseEntity<Map<String, Object>>> safetyFallback() {
        return serviceUnavailable("Safety Service");
    }

    @RequestMapping("/ai")
    public Mono<ResponseEntity<Map<String, Object>>> aiFallback() {
        return serviceUnavailable("AI Service");
    }

    @RequestMapping("/notification")
    public Mono<ResponseEntity<Map<String, Object>>> notificationFallback() {
        return serviceUnavailable("Notification Service");
    }

    @RequestMapping("/police")
    public Mono<ResponseEntity<Map<String, Object>>> policeFallback() {
        return serviceUnavailable("Police Service");
    }

    @RequestMapping("/admin")
    public Mono<ResponseEntity<Map<String, Object>>> adminFallback() {
        return serviceUnavailable("Admin Service");
    }

    @RequestMapping("/map")
    public Mono<ResponseEntity<Map<String, Object>>> mapFallback() {
        return serviceUnavailable("Map Service");
    }

    @RequestMapping("/files")
    public Mono<ResponseEntity<Map<String, Object>>> filesFallback() {
        return serviceUnavailable("File Service");
    }

    @RequestMapping("/complaint")
    public Mono<ResponseEntity<Map<String, Object>>> complaintFallback() {
        return serviceUnavailable("Complaint Service");
    }
}
