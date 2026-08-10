import { useState } from "react";
import police_logo from "/src/assets/image/Tamil_Nadu_Police_Logo.png";
import velora_logo from "/src/assets/image/velora-trans.png";
import { useNavigate, Link } from "react-router-dom";
import { policeLogin } from "../../../api/policeApi";
import { useAuth } from "../../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      alert("Please enter Phone Number and Password");
      return;
    }

    setLoading(true);
    try {
      const res = await policeLogin({ email: phoneNumber, phone: phoneNumber, password });
      const user = login(res); // saves JWT + user in context/localStorage
      const role = (user?.role || res?.data?.role || "").toUpperCase();
      if (role !== "POLICE" && role !== "ROLE_POLICE") {
        alert("Access Denied: Standard user accounts cannot log into Police Portal. Please use the User Login.");
        return;
      }
      navigate("/police/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <header className="top-header">

        <h1
          className="header-title"
          style={{ marginLeft: "250px" }}
        >
          Tamil Nadu Police Department
        </h1>

        <img
          src={velora_logo}
          alt="Logo"
          className="top-right-logo-1"
        />

      </header>

      <div className="login-card">

        <div className="header-bar">
          POLICE OFFICER SECURE LOGIN
        </div>

        <div className="avatar-placeholder">

          <img
            src={police_logo}
            alt="Police Logo"
            className="user-icon"
          />

        </div>

        <div className="input-group">

          <input
            type="text"
            placeholder="Email or Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

        </div>

        <div className="input-group">

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

        </div>

        <div className="options">

          <label>
            <input type="checkbox" />
            Remember Me
          </label>

          <p>
            <Link to="/police/forgotpassword">
              Forgot Password?
            </Link>
          </p>

        </div>

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "LOGGING IN..." : "LOG IN"}
        </button>

        <div style={{ marginTop: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ color: "#ffffff", margin: 0, fontSize: "14px" }}>
            New Officer?{" "}
            <Link to="/police/register" style={{ color: "#60a5fa", fontWeight: "bold", textDecoration: "underline" }}>
              Register Police
            </Link>
          </p>

          <p style={{ color: "#9ca3af", margin: 0, fontSize: "13px" }}>
            Not a police officer?{" "}
            <Link to="/login" style={{ color: "#ec4899", fontWeight: "bold", textDecoration: "underline" }}>
              Back to User Login
            </Link>
          </p>
        </div>

      </div>

    </div>
  );
}

export default Login;
