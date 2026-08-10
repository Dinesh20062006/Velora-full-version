package com.velora.auth.service;

import com.velora.auth.common.*;
import com.velora.auth.dto.*;
import com.velora.auth.entity.*;
import com.velora.auth.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       OtpRepository otpRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use");
        }
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BadRequestException("Phone number is already in use");
        }

        RoleType roleType = parseRole(request.getRole());
        Role role = roleRepository.findByName(roleType)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleType).description("Default " + roleType).build()));

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(role)
                .isEnabled(true)
                .isLocked(false)
                .build();
        user = userRepository.save(user);

        String accessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().getName().name(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getId());
        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName().name())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String input = request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                ? request.getPhoneNumber().trim()
                : (request.getEmail() != null ? request.getEmail().trim() : "");

        if (input.isBlank()) {
            throw new BadRequestException("Email or Phone number is required for login");
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Password is required for login");
        }

        String cleanPhone = input.replaceAll("[^0-9]", "");
        if (cleanPhone.startsWith("91") && cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(2);
        }

        final String targetPhone = cleanPhone;
        User user = userRepository.findByEmail(input)
                .or(() -> userRepository.findByPhoneNumber(input))
                .or(() -> userRepository.findByPhoneNumber(targetPhone))
                .or(() -> userRepository.findByLegacyMobileNumber(input))
                .or(() -> userRepository.findAll().stream()
                        .filter(u -> u.getPhoneNumber() != null && u.getPhoneNumber().replaceAll("[^0-9]", "").equals(targetPhone))
                        .findFirst())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials or user account does not exist. Please sign up first."));

        boolean isMatch = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!isMatch && user.getLegacyPassword() != null && user.getLegacyPassword().equals(request.getPassword())) {
            isMatch = true;
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            userRepository.save(user);
        }

        if (!isMatch) {
            throw new UnauthorizedException("Invalid email/phone or password. Please try again.");
        }

        if (!user.isEnabled()) {
            throw new UnauthorizedException("User account is disabled. Please contact support.");
        }

        if (user.isLocked()) {
            throw new UnauthorizedException("User account is locked due to security policy.");
        }

        String accessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().getName().name(), user.getId());
        String refreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getId());
        saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName().name())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (token.isRevoked() || token.getExpiryDate().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }
        User user = token.getUser();
        String newAccessToken = jwtUtils.generateAccessToken(user.getEmail(), user.getRole().getName().name(), user.getId());
        String newRefreshToken = jwtUtils.generateRefreshToken(user.getEmail(), user.getId());
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        saveRefreshToken(user, newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName().name())
                .build();
    }

    @Transactional
    public void sendOtp(SendOtpRequest request) {
        String phone = request.getPhoneNumber();
        String purpose = request.getPurpose() != null ? request.getPurpose() : "VERIFICATION";
        if (phone != null) {
            userRepository.findByPhoneNumber(phone).ifPresent(user -> {
            	String code = String.format("%06d", new Random().nextInt(900000) + 100000);
            	System.out.println("Reset Password OTP : " + code);
                Otp otp = Otp.builder()
                        .user(user)
                        .code(code)
                        .purpose(purpose)
                        .expiresAt(LocalDateTime.now().plusMinutes(10))
                        .isUsed(false)
                        .build();
                System.out.println("Generated OTP : " + code);
                otpRepository.save(otp);
            });
        }
    }

    @Transactional
    public void verifyOtp(OtpVerifyRequest request) {

        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Otp otp = otpRepository
                .findTopByUserAndPurposeAndIsUsedFalseOrderByIdDesc(user, "VERIFICATION")
                .orElseThrow(() -> new BadRequestException("No valid OTP found"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP expired");
        }

        if (!otp.getCode().equals(request.getCode())) {
            throw new BadRequestException("Invalid OTP");
        }

        otp.setUsed(true);
        otpRepository.save(otp);

        user.setEnabled(true);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse getCurrentUser(Long userId, String email) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null && email != null) {
            user = userRepository.findByEmail(email).orElse(null);
        }
        if (user == null) {
            return AuthResponse.builder()
                    .userId(userId != null ? userId : 1L)
                    .email(email != null ? email : "user@velora.app")
                    .fullName("Registered User")
                    .role("ROLE_USER")
                    .tokenType("Bearer")
                    .build();
        }
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().getName().name() : "ROLE_USER")
                .tokenType("Bearer")
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String code = String.format("%06d", new Random().nextInt(900000) + 100000);
        System.out.println("Reset Password OTP : " + code);
        Otp otp = Otp.builder()
                .user(user)
                .code(code)
                .purpose("RESET_PASSWORD")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .isUsed(false)
                .build();
        otpRepository.save(otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Otp otp = otpRepository.findTopByUserAndPurposeAndIsUsedFalseOrderByIdDesc(user, "RESET_PASSWORD")
                .orElseThrow(() -> new BadRequestException("No valid OTP found for password reset"));
        if (!otp.getCode().equals(request.getCode()) || otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired OTP code");
        }
        otp.setUsed(true);
        otpRepository.save(otp);
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private RoleType parseRole(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) return RoleType.ROLE_USER;
        String clean = rawRole.toUpperCase().trim();
        if (!clean.startsWith("ROLE_")) clean = "ROLE_" + clean;
        try {
            return RoleType.valueOf(clean);
        } catch (Exception e) {
            return RoleType.ROLE_USER;
        }
    }

    private void saveRefreshToken(User user, String tokenValue) {
        try {
            RefreshToken token = RefreshToken.builder()
                    .user(user)
                    .token(tokenValue)
                    .expiryDate(Instant.now().plusSeconds(7 * 24 * 60 * 60))
                    .isRevoked(false)
                    .build();
            refreshTokenRepository.save(token);
        } catch (Exception e) {
            log.warn("Could not save refresh token: {}", e.getMessage());
        }
    }
}
