import { Link, useNavigate, useLocation } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import otpImage from "../../../../assets/images/otp-banner.png";
import Button from "../../../../common/Button/Button";
import Input from "../../../../common/Input/Input";
import { verifyOtp, resendOtp, resetPassword } from "../../../../api/authApi";
import { useAuth } from "../../../../context/AuthContext";

function OTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Signup passes { identifier: phone, purpose: "SIGNUP", otp: "..." }
  // ForgotPassword passes { identifier: phone, purpose: "FORGOT_PASSWORD", otp: "..." }
  const { identifier, purpose, otp: stateOtp } = location.state || {};

  const [currentOtp, setCurrentOtp] = useState(stateOtp || "123456");
  const [showModal, setShowModal] = useState(true);

  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    // Show pop-up alert with OTP when page loads
    setShowModal(true);
  }, []);

  const handleAutofill = () => {
    const codeArr = currentOtp.split("").slice(0, 6);
    while (codeArr.length < 6) codeArr.push("0");
    setDigits(codeArr);
    setShowModal(false);
  };

  if (!identifier || !purpose) {
    return (
      <div className="otp">
        <div className="otp-container">
          <h1>OTP Verification</h1>
          <p>We couldn't find a pending verification request.</p>
          <Button text="Back to Sign Up" onClick={() => navigate("/signup")} />
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

  const handleVerify = async () => {
    setError("");
    setInfo("");
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    try {
      if (purpose === "SIGNUP") {
        await verifyOtp({ mobileNumber: identifier, otp: code });
        const authData = location.state?.authResponse;
        if (authData) {
          login(authData);
        }
        navigate("/emergency-contact-setup");
      } else if (purpose === "FORGOT_PASSWORD") {
        if (!newPassword || !confirmPassword) {
          setError("Please enter and confirm your new password");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await resetPassword({ email: location.state?.email || identifier, otp: code, newPassword });
        setInfo("Password reset successfully. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        await verifyOtp({ mobileNumber: identifier, otp: code });
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const res = await resendOtp(identifier);
      const newCode = res.data?.otp || String(Math.floor(100000 + Math.random() * 900000));
      setCurrentOtp(newCode);
      setShowModal(true);
      setInfo(`New OTP generated: ${newCode}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
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
          backgroundColor: "rgba(0, 0, 0, 0.75)",
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
              Verification OTP Code
            </h2>
            <p style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "16px" }}>
              Your verification code for <strong>{identifier}</strong> is:
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
        <p>Enter the 6-digit verification code sent to {identifier}.</p>

        {error && <p className="error-text" style={{ color: "red", margin: "8px 0" }}>{error}</p>}
        {info && <p className="info-text" style={{ color: "#38bdf8", margin: "8px 0" }}>{info}</p>}

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
            <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </>
        )}

        <Button text={loading ? "Verifying..." : "Verify OTP"} onClick={handleVerify} disabled={loading} />

        <div className="resend">
          Didn't receive the code?
          <Link to="#" onClick={(e) => { e.preventDefault(); handleResend(); }}>Resend OTP</Link>
        </div>
        <div className="resend">
          Back to Sign Up?
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
export default OTP;
