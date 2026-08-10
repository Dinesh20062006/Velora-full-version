package com.velora.auth.entity;

import com.velora.auth.common.BaseAuditableEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_mobile", columnList = "phone_number")
})
public class User extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "password", nullable = true)
    private String legacyPassword;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone_number", nullable = true, length = 50)
    private String phoneNumber;

    @Column(name = "mobile_number", nullable = true, length = 50)
    private String legacyMobileNumber;

    @Column(nullable = false)
    private boolean isEnabled = true;

    @Column(nullable = false)
    private boolean isLocked = false;

    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    public User() {}

    public User(Long id, String email, String passwordHash, String fullName, String phoneNumber, boolean isEnabled, boolean isLocked, int failedLoginAttempts, Role role) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.isEnabled = isEnabled;
        this.isLocked = isLocked;
        this.failedLoginAttempts = failedLoginAttempts;
        this.role = role;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String email;
        private String passwordHash;
        private String fullName;
        private String phoneNumber;
        private boolean isEnabled = true;
        private boolean isLocked = false;
        private int failedLoginAttempts = 0;
        private Role role;

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
        public UserBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserBuilder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public UserBuilder isEnabled(boolean isEnabled) { this.isEnabled = isEnabled; return this; }
        public UserBuilder isLocked(boolean isLocked) { this.isLocked = isLocked; return this; }
        public UserBuilder failedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }

        public User build() {
            return new User(id, email, passwordHash, fullName, phoneNumber, isEnabled, isLocked, failedLoginAttempts, role);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getLegacyPassword() { return legacyPassword; }
    public void setLegacyPassword(String legacyPassword) { this.legacyPassword = legacyPassword; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getLegacyMobileNumber() { return legacyMobileNumber; }
    public void setLegacyMobileNumber(String legacyMobileNumber) { this.legacyMobileNumber = legacyMobileNumber; }

    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }

    public boolean isLocked() { return isLocked; }
    public void setLocked(boolean locked) { isLocked = locked; }

    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
