package com.velora.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 50)
    private String purpose;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_used", nullable = false)
    private boolean isUsed = false;

    public Otp() {}

    public Otp(Long id, User user, String code, String purpose, LocalDateTime expiresAt, boolean isUsed) {
        this.id = id;
        this.user = user;
        this.code = code;
        this.purpose = purpose;
        this.expiresAt = expiresAt;
        this.isUsed = isUsed;
    }

    public static OtpBuilder builder() {
        return new OtpBuilder();
    }

    public static class OtpBuilder {
        private Long id;
        private User user;
        private String code;
        private String purpose;
        private LocalDateTime expiresAt;
        private boolean isUsed = false;

        public OtpBuilder id(Long id) { this.id = id; return this; }
        public OtpBuilder user(User user) { this.user = user; return this; }
        public OtpBuilder code(String code) { this.code = code; return this; }
        public OtpBuilder purpose(String purpose) { this.purpose = purpose; return this; }
        public OtpBuilder expiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; return this; }
        public OtpBuilder isUsed(boolean isUsed) { this.isUsed = isUsed; return this; }

        public Otp build() {
            return new Otp(id, user, code, purpose, expiresAt, isUsed);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return isUsed; }
    public void setUsed(boolean used) { isUsed = used; }
}
