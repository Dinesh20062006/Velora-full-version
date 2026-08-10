package com.velora.admin.service;

import com.velora.admin.dto.AdminLogDto;
import com.velora.admin.dto.SystemHealthDto;
import com.velora.admin.dto.SystemSettingDto;
import com.velora.admin.entity.AdminLog;
import com.velora.admin.entity.SystemSetting;
import com.velora.admin.repository.AdminLogRepository;
import com.velora.admin.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final AdminLogRepository adminLogRepository;
    private final SystemSettingRepository systemSettingRepository;

    // Manual Constructor
    public AdminService(AdminLogRepository adminLogRepository,
                        SystemSettingRepository systemSettingRepository) {
        this.adminLogRepository = adminLogRepository;
        this.systemSettingRepository = systemSettingRepository;
    }

    @Transactional
    public void logAction(Long adminUserId, String action, String details, String ipAddress) {

        AdminLog log = new AdminLog();

        log.setAdminUserId(adminUserId);
        log.setAction(action);
        log.setDetails(details);
        log.setIpAddress(ipAddress);

        adminLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AdminLogDto> getAuditLogs() {

        return adminLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToLogDto)
                .toList();
    }

    @Transactional
    public SystemSettingDto updateSetting(SystemSettingDto dto) {

        SystemSetting setting = systemSettingRepository
                .findBySettingKey(dto.getSettingKey())
                .orElseGet(() -> {
                    SystemSetting s = new SystemSetting();
                    s.setSettingKey(dto.getSettingKey());
                    return s;
                });

        setting.setSettingValue(dto.getSettingValue());
        setting.setDescription(dto.getDescription());

        setting = systemSettingRepository.save(setting);

        return mapToSettingDto(setting);
    }

    @Transactional(readOnly = true)
    public List<SystemSettingDto> getAllSettings() {

        return systemSettingRepository.findAll()
                .stream()
                .map(this::mapToSettingDto)
                .toList();
    }

    public SystemHealthDto getSystemHealth() {

        Map<String, String> services = new HashMap<>();

        services.put("api-gateway", "UP (8080)");
        services.put("auth-service", "UP (8081)");
        services.put("user-service", "UP (8082)");
        services.put("safety-service", "UP (8083)");
        services.put("ai-service", "UP (8084)");
        services.put("notification-service", "UP (8085)");
        services.put("police-service", "UP (8086)");
        services.put("admin-service", "UP (8087)");

        SystemHealthDto dto = new SystemHealthDto();

        dto.setStatus("UP");
        dto.setTotalRegisteredUsers(1420);
        dto.setTotalActivePoliceUnits(86);
        dto.setTotalIncidentsReported(312);
        dto.setTotalSosDispatched(45);
        dto.setMicroservicesHealth(services);

        return dto;
    }

    private AdminLogDto mapToLogDto(AdminLog log) {

        AdminLogDto dto = new AdminLogDto();

        dto.setId(log.getId());
        dto.setAdminUserId(log.getAdminUserId());
        dto.setAction(log.getAction());
        dto.setDetails(log.getDetails());
        dto.setIpAddress(log.getIpAddress());
        dto.setCreatedAt(log.getCreatedAt());

        return dto;
    }

    private SystemSettingDto mapToSettingDto(SystemSetting setting) {

        SystemSettingDto dto = new SystemSettingDto();

        dto.setId(setting.getId());
        dto.setSettingKey(setting.getSettingKey());
        dto.setSettingValue(setting.getSettingValue());
        dto.setDescription(setting.getDescription());

        return dto;
    }
}