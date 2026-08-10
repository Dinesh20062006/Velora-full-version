package com.velora.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class SendOtpRequest {
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    private String purpose;

    public SendOtpRequest() {}

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
