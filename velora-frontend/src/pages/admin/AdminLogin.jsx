import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../common/Input/Input";
import Button from "../../common/Button/Button";
import { login as loginApi } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import velora_logo from "/src/assets/image/velora-trans.png";

function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@velora.app");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your admin credentials");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      const user = login(res);
      const role = (user?.role || res?.data?.role || "").toUpperCase();
      if (role !== "ADMIN" && role !== "ROLE_ADMIN") {
        setError("Access Denied: Standard user or police accounts cannot access Admin Portal.");
        return;
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Admin authentication failed. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0b0f17", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
      <div style={{ background: "#1f2937", padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "400px", border: "1px solid #374151" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src={velora_logo} alt="Velora" style={{ height: "48px", marginBottom: "12px" }} />
          <h1 style={{ fontSize: "24px", color: "#ec4899" }}>Admin Portal Login</h1>
          <p style={{ color: "#9ca3af", fontSize: "14px" }}>Velora Security Control</p>
        </div>

        {error && <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "12px" }}>{error}</p>}

        <div style={{ marginBottom: "12px" }}>
          <Input type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <Button text={loading ? "Authenticating..." : "Sign In to Admin Console"} onClick={handleAdminLogin} disabled={loading} />

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "14px", color: "#9ca3af" }}>
          <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/login")}>← Back to User Login</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
