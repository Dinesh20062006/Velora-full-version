import { useRef, useState } from "react";
import otpImage from "/src/assets/image/otp-banner.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { policeVerifyOtp } from "../../../api/policeApi";
import { resendOtp, resetPassword } from "../../../api/authApi";
import { useAuth } from "../../../context/AuthContext";

function OTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { identifier, phone, purpose, email, otp: stateOtp } = location.state || {};
  const targetId = identifier || phone;

  const [currentOtp, setCurrentOtp] = useState(stateOtp || "123456");
  const [showModal, setShowModal] = useState(true);

  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutofill = () => {
    const codeArr = currentOtp.split("").slice(0, 6);
    while (codeArr.length < 6) codeArr.push("0");
    setDigits(codeArr);
    setShowModal(false);
  };

  if (!targetId) {
    return (
      <div className="otp" style={{ backgroundImage: "#0b0f19" }}>
        <div className="otp-container">
          <h1>OTP Verification</h1>
          <p>We couldn't find a pending verification request.</p>
          <button className="verify-btn" onClick={() => navigate("/police/register")}>
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  const handleDigitChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const verifyOTP = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      alert("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      if (purpose === "SIGNUP" || purpose === "POLICE_REGISTER") {
        await policeVerifyOtp({ mobileNumber: targetId, otp: code });
        const authData = location.state?.authResponse;
        if (authData) {
          login(authData);
        }
        alert("OTP Verified Successfully");
        navigate("/police/dashboard");
      } else if (purpose === "FORGOT_PASSWORD") {
        if (!newPassword || !confirmPassword) {
          alert("Please enter and confirm your new password");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          alert("Passwords do not match");
          setLoading(false);
          return;
        }
        await resetPassword({ email: email || targetId, otp: code, newPassword });
        alert("Password reset successful. Please log in with your new password.");
        navigate("/login");
      } else {
        await policeVerifyOtp({ mobileNumber: targetId, otp: code });
        navigate("/police/dashboard");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const res = await resendOtp(targetId);
      const newCode = res.data?.otp || String(Math.floor(100000 + Math.random() * 900000));
      setCurrentOtp(newCode);
      setShowModal(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="otp" style={{ position: "relative" }}>

      {/* Pop-Up Modal Banner for OTP Display */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#1e293b",
            color: "#ffffff",
            padding: "24px 32px",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            border: "1px solid #3b82f6"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔐</div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#60a5fa", marginBottom: "8px" }}>
              Police Officer OTP Verification
            </h2>
            <p style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "16px" }}>
              Verification code for <strong>{targetId}</strong>:
            </p>
            <div style={{
              fontSize: "32px",
              fontWeight: "800",
              letterSpacing: "6px",
              color: "#38bdf8",
              backgroundColor: "#0f172a",
              padding: "12px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: "1px dashed #38bdf8"
            }}>
              {currentOtp}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={handleAutofill}
                style={{
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                Auto-fill Code
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: "#475569",
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="otp-container">

        <img src={otpImage} alt="OTP Verification" className="otp-image" />
        <h1>OTP Verification</h1>

        <p className="otp-text">Enter the 6-digit verification code sent to {targetId}.</p>

        <div className="otp-inputs">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              maxLength="1"
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
            />
          ))}
        </div>

        {purpose === "FORGOT_PASSWORD" && (
          <>
            <input
              type="password"
              placeholder="New Password"
              className="mobile-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              className="mobile-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        )}

        <button className="verify-btn" onClick={verifyOTP} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <div className="resend">
          Didn't receive the code?
          <Link onClick={resend}>Resend OTP</Link>
        </div>

      </div>
    </div>
  );
}

export default OTP;
