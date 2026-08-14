import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import loginImage from "../../../../assets/images/login-banner.png";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import { login as loginApi } from "../../../../api/authApi";
import { useAuth } from "../../../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!phone || !password) {
      setError("Please enter your email/phone number and password");
      return;
    }

    setLoading(true);
    try {
      // Backend LoginRequest accepts email or mobile
      const res = await loginApi({ email: phone, password, mobileNumber: phone });
      const user = login(res); // saves JWT + user in context/localStorage
      
      const role = (user?.role || res?.data?.role || "").toUpperCase();
      if (role === "ROLE_POLICE" || role === "POLICE") {
        navigate("/police/dashboard");
      } else if (role === "ROLE_ADMIN" || role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <div className="login-left">
          <img src={loginImage} alt="Login" className="login-image" />
        </div>

        <div className="login-right">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to Velora</p>

          {error && <p className="error-text" style={{ color: "red", margin: "8px 0" }}>{error}</p>}

          <Input type="text" placeholder="Email or Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <Button text={loading ? "Signing in..." : "Login"} onClick={handleLogin} disabled={loading} />

          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </div>

          <div className="signup-link" style={{ marginTop: "12px" }}>
            Portal Access: <span style={{ color: "#3182ce", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/police/register")}>Police Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
