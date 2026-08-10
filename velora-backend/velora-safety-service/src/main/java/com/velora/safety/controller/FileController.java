package com.velora.safety.controller;

import com.velora.safety.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "File Uploads", description = "Endpoints for uploading user avatars and incident evidence images")
public class FileController {

    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload profile picture")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfileImage(
            @RequestPart("file") MultipartFile file) {
        String filename = "profile_" + UUID.randomUUID().toString() + "_" + (file != null ? file.getOriginalFilename() : "avatar.jpg");
        String imageUrl = "/uploads/profiles/" + filename;
        return ResponseEntity.ok(ApiResponse.success("Profile image uploaded successfully", Map.of("imageUrl", imageUrl)));
    }

    @PostMapping(value = "/incident-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload incident evidence photo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadIncidentImage(
            @RequestPart("file") MultipartFile file) {
        String filename = "incident_" + UUID.randomUUID().toString() + "_" + (file != null ? file.getOriginalFilename() : "evidence.jpg");
        String imageUrl = "/uploads/incidents/" + filename;
        return ResponseEntity.ok(ApiResponse.success("Incident evidence image uploaded successfully", Map.of("imageUrl", imageUrl)));
    }
}
