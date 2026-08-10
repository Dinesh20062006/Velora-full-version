package com.velora.user.service;

import com.velora.user.common.BadRequestException;
import com.velora.user.common.ResourceNotFoundException;
import com.velora.user.dto.*;
import com.velora.user.entity.EmergencyContact;
import com.velora.user.entity.UserProfile;
import com.velora.user.repository.EmergencyContactRepository;
import com.velora.user.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserProfileRepository userProfileRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    @Value("${velora.upload.path:uploads/profile-images}")
    private String uploadPath;

    @Value("${velora.upload.base-url:http://localhost:8082/files}")
    private String baseUrl;

    public UserService(UserProfileRepository userProfileRepository, EmergencyContactRepository emergencyContactRepository) {
        this.userProfileRepository = userProfileRepository;
        this.emergencyContactRepository = emergencyContactRepository;
    }

    @Transactional
    public UserProfileResponse getProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> userProfileRepository.save(
                        UserProfile.builder()
                                .userId(userId)
                                .fullName("Registered User")
                                .email("user@velora.app")
                                .phoneNumber("+91 98765 43210")
                                .role("ROLE_USER")
                                .active(true)
                                .notificationEnabled(true)
                                .locationSharingEnabled(true)
                                .build()
                ));
        return mapToResponse(profile);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder()
                        .userId(userId)
                        .fullName("Registered User")
                        .email("user@velora.app")
                        .role("ROLE_USER")
                        .active(true)
                        .build());

        if (StringUtils.hasText(request.getFullName())) profile.setFullName(request.getFullName());
        if (StringUtils.hasText(request.getEmail())) profile.setEmail(request.getEmail());
        if (StringUtils.hasText(request.getPhoneNumber())) profile.setPhoneNumber(request.getPhoneNumber());
        if (StringUtils.hasText(request.getDateOfBirth())) profile.setDateOfBirth(request.getDateOfBirth());
        if (StringUtils.hasText(request.getGender())) profile.setGender(request.getGender());
        if (StringUtils.hasText(request.getAddress())) profile.setAddress(request.getAddress());
        if (StringUtils.hasText(request.getCity())) profile.setCity(request.getCity());
        if (StringUtils.hasText(request.getState())) profile.setState(request.getState());
        if (StringUtils.hasText(request.getCountry())) profile.setCountry(request.getCountry());
        if (request.getHomeLatitude() != null) profile.setHomeLatitude(request.getHomeLatitude());
        if (request.getHomeLongitude() != null) profile.setHomeLongitude(request.getHomeLongitude());
        if (request.getWorkLatitude() != null) profile.setWorkLatitude(request.getWorkLatitude());
        if (request.getWorkLongitude() != null) profile.setWorkLongitude(request.getWorkLongitude());
        if (request.getNotificationEnabled() != null) profile.setNotificationEnabled(request.getNotificationEnabled());
        if (request.getLocationSharingEnabled() != null) profile.setLocationSharingEnabled(request.getLocationSharingEnabled());
        if (request.getPrivacyModeEnabled() != null) profile.setPrivacyModeEnabled(request.getPrivacyModeEnabled());
        if (StringUtils.hasText(request.getBloodGroup())) profile.setBloodGroup(request.getBloodGroup());
        if (StringUtils.hasText(request.getEmergencyNotes())) profile.setEmergencyNotes(request.getEmergencyNotes());

        return mapToResponse(userProfileRepository.save(profile));
    }

    @Transactional
    public UserProfileResponse createProfile(Long userId, String fullName, String email, String role) {
        if (userProfileRepository.existsByUserId(userId)) {
            return getProfile(userId);
        }
        UserProfile profile = UserProfile.builder().userId(userId).fullName(fullName).email(email).role(role).build();
        return mapToResponse(userProfileRepository.save(profile));
    }

    @Transactional
    public String uploadProfileImage(Long userId, MultipartFile file) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user: " + userId));

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size cannot exceed 5MB");
        }

        try {
            String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + extension;
            Path uploadDir = Paths.get(uploadPath);
            Files.createDirectories(uploadDir);
            Path filePath = uploadDir.resolve(filename);
            Files.write(filePath, file.getBytes());
            String imageUrl = baseUrl + "/" + filename;
            profile.setProfileImageUrl(imageUrl);
            userProfileRepository.save(profile);
            return imageUrl;
        } catch (IOException e) {
            log.error("Failed to upload profile image for user {}: {}", userId, e.getMessage());
            throw new BadRequestException("Failed to upload image: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<EmergencyContactResponse> getEmergencyContacts(Long userId) {
        return emergencyContactRepository.findByUserIdOrderByPrimaryDescCreatedAtAsc(userId).stream()
                .map(this::mapContactToResponse)
                .toList();
    }

    @Transactional
    public EmergencyContactResponse addEmergencyContact(Long userId, EmergencyContactRequest request) {
        long count = emergencyContactRepository.countByUserId(userId);
        if (count >= 5) {
            throw new BadRequestException("Maximum of 5 emergency contacts allowed");
        }
        EmergencyContact contact = EmergencyContact.builder()
                .userId(userId)
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .relationship(request.getRelationship())
                .primary(request.isPrimary())
                .notifyOnSos(request.isNotifyOnSos())
                .notifyOnRouteDeviation(request.isNotifyOnRouteDeviation())
                .build();
        return mapContactToResponse(emergencyContactRepository.save(contact));
    }

    @Transactional
    public EmergencyContactResponse updateEmergencyContact(Long userId, Long contactId, EmergencyContactRequest request) {
        EmergencyContact contact = emergencyContactRepository.findByIdAndUserId(contactId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found"));
        contact.setName(request.getName());
        contact.setPhoneNumber(request.getPhoneNumber());
        contact.setEmail(request.getEmail());
        contact.setRelationship(request.getRelationship());
        contact.setPrimary(request.isPrimary());
        contact.setNotifyOnSos(request.isNotifyOnSos());
        contact.setNotifyOnRouteDeviation(request.isNotifyOnRouteDeviation());
        return mapContactToResponse(emergencyContactRepository.save(contact));
    }

    @Transactional
    public void deleteEmergencyContact(Long userId, Long contactId) {
        if (!emergencyContactRepository.existsByIdAndUserId(contactId, userId)) {
            throw new ResourceNotFoundException("Emergency contact not found");
        }
        emergencyContactRepository.deleteById(contactId);
    }

    private UserProfileResponse mapToResponse(UserProfile profile) {
        return UserProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .fullName(profile.getFullName())
                .email(profile.getEmail())
                .phoneNumber(profile.getPhoneNumber())
                .profileImageUrl(profile.getProfileImageUrl())
                .dateOfBirth(profile.getDateOfBirth())
                .gender(profile.getGender())
                .address(profile.getAddress())
                .city(profile.getCity())
                .state(profile.getState())
                .country(profile.getCountry())
                .bloodGroup(profile.getBloodGroup())
                .emergencyNotes(profile.getEmergencyNotes())
                .homeLatitude(profile.getHomeLatitude())
                .homeLongitude(profile.getHomeLongitude())
                .workLatitude(profile.getWorkLatitude())
                .workLongitude(profile.getWorkLongitude())
                .role(profile.getRole())
                .active(profile.isActive())
                .notificationEnabled(profile.isNotificationEnabled())
                .locationSharingEnabled(profile.isLocationSharingEnabled())
                .privacyModeEnabled(profile.isPrivacyModeEnabled())
                .build();
    }

    private EmergencyContactResponse mapContactToResponse(EmergencyContact contact) {
        return EmergencyContactResponse.builder()
                .id(contact.getId())
                .userId(contact.getUserId())
                .name(contact.getName())
                .phoneNumber(contact.getPhoneNumber())
                .email(contact.getEmail())
                .relationship(contact.getRelationship())
                .primary(contact.isPrimary())
                .notifyOnSos(contact.isNotifyOnSos())
                .notifyOnRouteDeviation(contact.isNotifyOnRouteDeviation())
                .build();
    }
}
