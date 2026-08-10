package com.velora.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpVerifyRequest {
    private String email;
    private String phoneNumber;
    @NotBlank(message = "OTP code is required")
    private String code;

    public OtpVerifyRequest() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
