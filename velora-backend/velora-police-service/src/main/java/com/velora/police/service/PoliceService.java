package com.velora.police.service;

import com.velora.police.common.ResourceNotFoundException;
import com.velora.police.dto.CreateSosRequest;
import com.velora.police.dto.PoliceUnitDto;
import com.velora.police.dto.SosAlertDto;
import com.velora.police.entity.PoliceUnit;
import com.velora.police.entity.SosAlert;
import com.velora.police.repository.PoliceUnitRepository;
import com.velora.police.repository.SosAlertRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PoliceService {

    private final SosAlertRepository sosAlertRepository;
    private final PoliceUnitRepository policeUnitRepository;

    public PoliceService(SosAlertRepository sosAlertRepository, PoliceUnitRepository policeUnitRepository) {
        this.sosAlertRepository = sosAlertRepository;
        this.policeUnitRepository = policeUnitRepository;
    }

    @Transactional
    public SosAlertDto triggerSos(CreateSosRequest request) {
        SosAlert alert = SosAlert.builder()
                .userId(request.getUserId())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status("ACTIVE")
                .build();
        alert = sosAlertRepository.save(alert);
        return mapToSosDto(alert);
    }

    @Transactional(readOnly = true)
    public List<SosAlertDto> getActiveSosAlerts() {
        List<SosAlert> alerts = sosAlertRepository.findAll();
        if (alerts == null || alerts.isEmpty()) {
            return List.of();
        }
        return alerts.stream().map(this::mapToSosDto).toList();
    }

    @Transactional
    public SosAlertDto updateSosStatus(Long sosId, String status, Long policeId) {
        SosAlert alert = sosAlertRepository.findById(sosId)
                .orElseThrow(() -> new ResourceNotFoundException("SOS Alert not found"));
        alert.setStatus(status);
        if (policeId != null) {
            alert.setAssignedPoliceId(policeId);
        }
        if ("RESOLVED".equalsIgnoreCase(status) || "FALSE_ALARM".equalsIgnoreCase(status)) {
            alert.setResolvedAt(LocalDateTime.now());
        }
        alert = sosAlertRepository.save(alert);
        return mapToSosDto(alert);
    }

    @Transactional
    public PoliceUnitDto registerPoliceUnit(PoliceUnitDto dto) {
        PoliceUnit unit = PoliceUnit.builder()
                .userId(dto.getUserId())
                .stationName(dto.getStationName())
                .badgeNumber(dto.getBadgeNumber())
                .emergencyHotline(dto.getEmergencyHotline())
                .currentLat(dto.getCurrentLat())
                .currentLng(dto.getCurrentLng())
                .isAvailable(true)
                .build();
        unit = policeUnitRepository.save(unit);
        return mapToUnitDto(unit);
    }

    @Transactional(readOnly = true)
    public PoliceUnitDto getPoliceUnitByUserId(Long userId) {
        PoliceUnit unit = policeUnitRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Police Unit not registered"));
        return mapToUnitDto(unit);
    }

    private SosAlertDto mapToSosDto(SosAlert alert) {
        return SosAlertDto.builder()
                .id(alert.getId())
                .userId(alert.getUserId())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .status(alert.getStatus())
                .assignedPoliceId(alert.getAssignedPoliceId())
                .createdAt(alert.getCreatedAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }

    private PoliceUnitDto mapToUnitDto(PoliceUnit unit) {
        return PoliceUnitDto.builder()
                .id(unit.getId())
                .userId(unit.getUserId())
                .stationName(unit.getStationName())
                .badgeNumber(unit.getBadgeNumber())
                .emergencyHotline(unit.getEmergencyHotline())
                .currentLat(unit.getCurrentLat())
                .currentLng(unit.getCurrentLng())
                .isAvailable(unit.isAvailable())
                .build();
    }
}
