import React, { useState } from "react";
import forgotImage from "/src/assets/image/forgot-password.png";
import { useNavigate } from "react-router-dom";
import { policeForgotPassword } from "../../../api/policeApi";

function ForgotPassword() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone) {
      alert("Please enter your registered phone number");
      return;
    }

    setLoading(true);
    try {
      await policeForgotPassword(phone);
      navigate("/police/otp", { state: { identifier: phone, email: phone, purpose: "FORGOT_PASSWORD" } });
    } catch (err) {
      alert(err.response?.data?.message || "Could not send OTP. Please check email/phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot">
      <div className="forgot-container">

        <img
          src={forgotImage}
          alt="Forgot Password"
          className="forgot-image"
        />

        <h1>
          Forgot Password?
        </h1>

        <p style={{ color: 'black' }}>
          Enter your registered mobile number.
          We'll send you an OTP to reset your password.
        </p>

        <input
          type="tel"
          placeholder="Mobile Number"
          className="mobile-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <button className="otp-button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </button>

      </div>
    </div>
  );
}

export default ForgotPassword;
