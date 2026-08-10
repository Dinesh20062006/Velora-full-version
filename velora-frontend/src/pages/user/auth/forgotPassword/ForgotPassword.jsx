import { useState } from "react";
import { useNavigate } from "react-router-dom";

import forgotImage from "../../../../assets/images/forgot-password.png";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import { forgotPassword } from "../../../../api/authApi";

function ForgotPassword() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    setError("");
    if (!phone) {
      setError("Please enter your registered phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(phone);
      alert(`Your OTP is: ${res.data.otp}`);
      navigate("/otp", { state: { identifier: phone, purpose: "FORGOT_PASSWORD" } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP. Please check the phone number and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot">
      <div className="forgot-container">
        <img src={forgotImage} alt="Forgot Password" className="forgot-image" />

        <h1>Forgot Password?</h1>

        <p>
          Enter your registered phone number.
          We'll send you an OTP to reset your password.
        </p>

        {error && <p className="error-text">{error}</p>}

        <Input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Button
          text={loading ? "Sending..." : "Send OTP"}
          onClick={handleSendOTP}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default ForgotPassword;
