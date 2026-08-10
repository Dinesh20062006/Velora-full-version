package com.velora.notification.service;

import com.velora.notification.common.ResourceNotFoundException;
import com.velora.notification.dto.NotificationDto;
import com.velora.notification.dto.SendNotificationRequest;
import com.velora.notification.entity.Notification;
import com.velora.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public NotificationDto sendNotification(SendNotificationRequest request) {
        Notification.NotificationType notificationType = Notification.NotificationType.INFO;
        if (request.getType() != null) {
            try {
                notificationType = Notification.NotificationType.valueOf(request.getType().toUpperCase());
            } catch (Exception ignored) {
            }
        }
        Notification notification = Notification.builder()
                .userId(request.getRecipientUserId())
                .title(request.getTitle())
                .message(request.getMessage())
                .type(notificationType)
                .read(false)
                .build();
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    private NotificationDto mapToDto(Notification entity) {
        return NotificationDto.builder()
                .id(entity.getId())
                .recipientUserId(entity.getUserId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType() != null ? entity.getType().name() : "INFO")
                .isRead(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
