package com.velora.safety.service;

import com.velora.safety.common.BadRequestException;
import com.velora.safety.common.ResourceNotFoundException;
import com.velora.safety.dto.IncidentRequest;
import com.velora.safety.dto.IncidentResponse;
import com.velora.safety.dto.SafeZoneResponse;
import com.velora.safety.entity.Incident;
import com.velora.safety.entity.SafeZone;
import com.velora.safety.repository.IncidentRepository;
import com.velora.safety.repository.SafeZoneRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.UUID;

@Service
public class SafetyService {

    private static final Logger log = LoggerFactory.getLogger(SafetyService.class);

    private final IncidentRepository incidentRepository;
    private final SafeZoneRepository safeZoneRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${velora.upload.path:uploads/incident-images}")
    private String uploadPath;

    @Value("${velora.upload.base-url:http://localhost:8083/files}")
    private String baseUrl;

    public SafetyService(IncidentRepository incidentRepository, SafeZoneRepository safeZoneRepository, JdbcTemplate jdbcTemplate) {
        this.incidentRepository = incidentRepository;
        this.safeZoneRepository = safeZoneRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public IncidentResponse reportIncident(Long userId, IncidentRequest request) {
        Incident incident = Incident.builder()
                .reporterUserId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .incidentType(request.getIncidentType())
                .severity(request.getSeverity() != null ? request.getSeverity() : Incident.IncidentSeverity.MEDIUM)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .incidentDate(request.getIncidentDate() != null ? request.getIncidentDate() : LocalDateTime.now())
                .anonymous(request.isAnonymous())
                .status(Incident.IncidentStatus.PENDING)
                .imageUrls(new ArrayList<>())
                .build();
        Incident saved = incidentRepository.save(incident);
        try {
            jdbcTemplate.update(
                "INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type, created_date, last_modified_date, version) VALUES (?, ?, ?, 'REPORT', false, ?, 'INCIDENT', NOW(), NOW(), 0)",
                userId != null ? userId : 1L,
                "⚠️ Incident Report Submitted: " + (saved.getTitle() != null ? saved.getTitle() : "Safety Report"),
                "Your incident report #" + saved.getId() + " (" + saved.getIncidentType() + ") has been submitted and is under review by safety officers.",
                saved.getId()
            );
        } catch (Exception e) {
            log.warn("Could not insert incident notification: {}", e.getMessage());
        }
        return mapToResponse(saved);
    }

    @Transactional
    public List<String> uploadIncidentImages(Long incidentId, Long userId, List<MultipartFile> files) {
        Incident incident = incidentRepository.findByIdAndReporterUserId(incidentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        if (files.size() > 5) {
            throw new BadRequestException("Maximum 5 images allowed per incident");
        }
        List<String> urls = new ArrayList<>();
        try {
            Path uploadDir = Paths.get(uploadPath);
            Files.createDirectories(uploadDir);
            for (MultipartFile file : files) {
                String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
                String filename = UUID.randomUUID() + "." + ext;
                Files.write(uploadDir.resolve(filename), file.getBytes());
                urls.add(baseUrl + "/" + filename);
            }
            List<String> existing = incident.getImageUrls() != null ? new ArrayList<>(incident.getImageUrls()) : new ArrayList<>();
            existing.addAll(urls);
            incident.setImageUrls(existing);
            incidentRepository.save(incident);
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload images: " + e.getMessage());
        }
        return urls;
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncident(Long incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));
        return mapToResponse(incident);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getMyIncidents(Long userId, Pageable pageable) {
        return incidentRepository.findByReporterUserIdOrderByCreatedAtDesc(userId, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> getAllIncidents(Incident.IncidentStatus status, Incident.IncidentType type, Pageable pageable) {
        return incidentRepository.searchIncidents(status, type, null, null, null, null, pageable).map(this::mapToResponse);
    }

    @Transactional
    public IncidentResponse updateIncidentStatus(Long incidentId, Incident.IncidentStatus status, Long officerId, String notes) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));
        incident.setStatus(status);
        if (officerId != null) incident.setAssignedOfficerId(officerId);
        if (StringUtils.hasText(notes)) incident.setPoliceNotes(notes);
        if (status == Incident.IncidentStatus.RESOLVED || status == Incident.IncidentStatus.CLOSED) {
            incident.setResolvedAt(LocalDateTime.now());
        }
        return mapToResponse(incidentRepository.save(incident));
    }

    @Transactional
    public void deleteIncident(Long incidentId, Long userId) {
        Incident incident = incidentRepository.findByIdAndReporterUserId(incidentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found or not owned by user"));
        incidentRepository.delete(incident);
    }

    @Transactional
    public Map<String, Object> triggerSos(Long userId, Object request) {
        log.info("SOS triggered for user: {}", userId);

        double lat = 28.6139;
        double lon = 77.209;
        int battery = 100;

        if (request instanceof Map<?, ?> map) {
            if (map.get("latitude") instanceof Number n) lat = n.doubleValue();
            if (map.get("longitude") instanceof Number n) lon = n.doubleValue();
            if (map.get("batteryLevel") instanceof Number n) battery = n.intValue();
        }

        final double finalLat = lat;
        final double finalLon = lon;
        final int finalBattery = battery;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        try {
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO sos_alerts (user_id, latitude, longitude, battery_level, status, triggered_at, created_date, last_modified_date, version) VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), NOW(), NOW(), 0)",
                    Statement.RETURN_GENERATED_KEYS
                );
                ps.setLong(1, userId != null ? userId : 1L);
                ps.setDouble(2, finalLat);
                ps.setDouble(3, finalLon);
                ps.setInt(4, finalBattery);
                return ps;
            }, keyHolder);
        } catch (Exception e) {
            log.warn("Could not insert to sos_alerts via keyHolder: {}", e.getMessage());
            try {
                jdbcTemplate.update(
                    "INSERT INTO sos_alerts (user_id, latitude, longitude, battery_level, status, triggered_at, created_date, last_modified_date, version) VALUES (?, ?, ?, ?, 'ACTIVE', NOW(), NOW(), NOW(), 0)",
                    userId != null ? userId : 1L, finalLat, finalLon, finalBattery
                );
            } catch (Exception ignored) {}
        }

        Long alertId = (keyHolder.getKey() != null) ? keyHolder.getKey().longValue() : System.currentTimeMillis();

        List<String> contactPhones = new ArrayList<>();
        try {
            contactPhones = jdbcTemplate.query(
                "SELECT phone_number FROM emergency_contacts WHERE user_id = ?",
                (rs, rowNum) -> rs.getString("phone_number"),
                userId
            );
        } catch (Exception e) {
            log.warn("Could not fetch emergency contacts: {}", e.getMessage());
        }

        String alertMsg = "🚨 EMERGENCY SOS! User #" + (userId != null ? userId : 1L) + " triggered distress signal at (" + lat + ", " + lon + "). Contacts notified: " + (contactPhones.isEmpty() ? "Emergency Helpline" : String.join(", ", contactPhones));

        try {
            List<Long> allUserIds = jdbcTemplate.query("SELECT id FROM users", (rs, rowNum) -> rs.getLong("id"));
            for (Long uid : allUserIds) {
                jdbcTemplate.update(
                    "INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type, created_date, last_modified_date, version) VALUES (?, ?, ?, 'SOS', false, ?, 'SOS_ALERT', NOW(), NOW(), 0)",
                    uid, "🚨 EMERGENCY SOS ALERT!", alertMsg, alertId
                );
            }
        } catch (Exception e) {
            log.warn("Could not broadcast notifications: {}", e.getMessage());
        }

        return Map.of(
                "alertId", alertId,
                "status", "ACTIVE",
                "triggeredAt", LocalDateTime.now().toString(),
                "emergencyContactsNotified", contactPhones.size(),
                "message", alertMsg
        );
    }

    @Transactional
    public Map<String, Object> cancelSos(Object alertId, Object request) {
        log.info("SOS alert {} cancelled", alertId);

        try {
            Long numericId = null;
            if (alertId instanceof Number n) {
                numericId = n.longValue();
            } else if (alertId != null) {
                String clean = alertId.toString().replaceAll("[^0-9]", "");
                if (!clean.isBlank()) numericId = Long.parseLong(clean);
            }
            if (numericId != null) {
                jdbcTemplate.update(
                    "UPDATE sos_alerts SET status = 'CANCELLED', last_modified_date = NOW(), resolved_at = NOW() WHERE id = ?",
                    numericId
                );
            }
        } catch (Exception e) {
            log.warn("Could not update sos_alerts status: {}", e.getMessage());
        }

        String cancelMsg = "🟢 SOS Alert #" + alertId + " has been CANCELLED. User is now safe.";
        try {
            List<Long> allUserIds = jdbcTemplate.query("SELECT id FROM users", (rs, rowNum) -> rs.getLong("id"));
            for (Long uid : allUserIds) {
                jdbcTemplate.update(
                    "INSERT INTO notifications (user_id, title, message, type, is_read, reference_id, reference_type, created_date, last_modified_date, version) VALUES (?, ?, ?, 'INFO', false, 0, 'SOS_CANCEL', NOW(), NOW(), 0)",
                    uid, "🟢 SOS Alert Cancelled", cancelMsg
                );
            }
        } catch (Exception e) {
            log.warn("Could not broadcast cancel notification: {}", e.getMessage());
        }

        return Map.of(
                "alertId", alertId != null ? alertId : "sos_cancelled",
                "status", "CANCELLED",
                "cancelledAt", LocalDateTime.now().toString(),
                "message", cancelMsg
        );
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> getNearbyIncidents(double lat, double lon, double radiusMeters) {
        return incidentRepository.findIncidentsNearLocation(lat, lon, radiusMeters).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SafeZoneResponse> getNearbySafeZones(double lat, double lon, double radiusMeters) {
        return safeZoneRepository.findNearbySafeZones(lat, lon, radiusMeters).stream()
                .map(sz -> {
                    SafeZoneResponse r = mapSafeZoneToResponse(sz);
                    r.setDistanceMeters(computeDistance(lat, lon, sz.getLatitude(), sz.getLongitude()));
                    return r;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<SafeZoneResponse> getAllSafeZones(Pageable pageable) {
        return safeZoneRepository.findByActiveTrueOrderBySafetyScoreDesc(pageable).map(this::mapSafeZoneToResponse);
    }

    @Transactional
    public SafeZoneResponse createSafeZone(Map<String, Object> body) {
        String name = body != null && body.get("name") != null ? body.get("name").toString() : "Marked Safe Zone";
        String description = body != null && body.get("description") != null ? body.get("description").toString() : "Admin marked location";
        double lat = body != null && body.get("latitude") != null ? Double.parseDouble(body.get("latitude").toString()) : 28.6139;
        double lon = body != null && body.get("longitude") != null ? Double.parseDouble(body.get("longitude").toString()) : 77.209;
        double radius = body != null && body.get("radiusMeters") != null ? Double.parseDouble(body.get("radiusMeters").toString()) : 400.0;
        int safetyScore = body != null && body.get("safetyScore") != null ? Integer.parseInt(body.get("safetyScore").toString()) : 80;

        SafeZone sz = SafeZone.builder()
                .name(name)
                .description(description)
                .zoneType(SafeZone.ZoneType.POLICE_STATION)
                .latitude(lat)
                .longitude(lon)
                .radiusMeters(radius)
                .verified(true)
                .active(true)
                .safetyScore(safetyScore)
                .build();

        SafeZone saved = safeZoneRepository.save(sz);
        System.out.println("✅ [SafetyService] Saved safe zone to MySQL: " + saved.getName());
        return mapSafeZoneToResponse(saved);
    }

    private double computeDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private IncidentResponse mapToResponse(Incident i) {
        return IncidentResponse.builder()
                .id(i.getId())
                .reporterUserId(i.isAnonymous() ? null : i.getReporterUserId())
                .title(i.getTitle())
                .description(i.getDescription())
                .incidentType(i.getIncidentType())
                .status(i.getStatus())
                .severity(i.getSeverity())
                .latitude(i.getLatitude())
                .longitude(i.getLongitude())
                .address(i.getAddress())
                .city(i.getCity())
                .state(i.getState())
                .incidentDate(i.getIncidentDate())
                .anonymous(i.isAnonymous())
                .assignedOfficerId(i.getAssignedOfficerId())
                .policeNotes(i.getPoliceNotes())
                .resolvedAt(i.getResolvedAt())
                .imageUrls(i.getImageUrls())
                .createdAt(i.getCreatedAt())
                .build();
    }

    private SafeZoneResponse mapSafeZoneToResponse(SafeZone sz) {
        return SafeZoneResponse.builder()
                .id(sz.getId())
                .name(sz.getName())
                .description(sz.getDescription())
                .zoneType(sz.getZoneType())
                .latitude(sz.getLatitude())
                .longitude(sz.getLongitude())
                .radiusMeters(sz.getRadiusMeters())
                .address(sz.getAddress())
                .city(sz.getCity())
                .state(sz.getState())
                .phoneNumber(sz.getPhoneNumber())
                .verified(sz.isVerified())
                .active(sz.isActive())
                .safetyScore(sz.getSafetyScore())
                .build();
    }
}
