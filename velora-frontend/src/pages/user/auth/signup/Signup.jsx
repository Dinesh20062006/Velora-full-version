import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import signupImage from "../../../../assets/images/signup-banner.png";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import { signup } from "../../../../api/authApi";
import { useAuth } from "../../../../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");

    if (!fullName || !phone || !password || !confirmPassword) {
      setError("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const computedEmail = email.trim() || `${phone.replace(/\D/g, "") || "user"}@velora.app`;
      const res = await signup({
        fullName,
        email: computedEmail,
        mobileNumber: phone,
        password,
        role: "ROLE_USER"
      });
      login(res); // Log user in immediately using returned access token
      navigate("/emergency-contact-setup");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please check inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup">
      <div className="signup-container">
        <div className="signup-left">
          <img src={signupImage} alt="Signup" className="signup-image" />
        </div>

        <div className="signup-right">
          <h1>Create Account</h1>
          <p>Join Velora and stay safe everywhere</p>

          {error && <p className="error-text" style={{ color: "red", margin: "8px 0" }}>{error}</p>}

          <Input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" placeholder="Email Address (Optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="tel" placeholder="Mobile / Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          <Button text={loading ? "Creating account..." : "Sign Up"} onClick={handleSignup} disabled={loading} />

          <div className="login-link">
            Already have an account?
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
