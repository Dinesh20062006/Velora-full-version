import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  IoHomeOutline,
  IoCompassOutline,
  IoShieldCheckmarkOutline,
  IoPulseOutline,
  IoDocumentTextOutline,
  IoPeopleOutline,
  IoLogOutOutline,
} from "react-icons/io5";

function Sidebar({ collapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={collapse ? "sidebar small" : "sidebar"}>
      <div className="SidebarAlign">
        <div
          onClick={() => navigate("/dashboard")}
          className={`menu ${location.pathname === "/dashboard" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoHomeOutline /> {!collapse && "Dashboard"}
        </div>

        <div
          onClick={() => navigate("/safe-route")}
          className={`menu ${location.pathname === "/safe-route" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoCompassOutline /> {!collapse && "Safe Route"}
        </div>

        <div
          onClick={() => navigate("/safe-zones")}
          className={`menu ${location.pathname === "/safe-zones" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoShieldCheckmarkOutline /> {!collapse && "Safe Zones"}
        </div>

        <div
          onClick={() => navigate("/ai-analysis")}
          className={`menu ${location.pathname === "/ai-analysis" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoPulseOutline /> {!collapse && "AI Safety"}
        </div>

        <div
          onClick={() => navigate("/report")}
          className={`menu ${location.pathname === "/report" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoDocumentTextOutline /> {!collapse && "Report Incident"}
        </div>

        <div
          onClick={() => navigate("/emergency-contacts")}
          className={`menu ${location.pathname === "/emergency-contacts" ? "active" : ""}`}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "8px", margin: "4px 0", transition: "all 0.2s" }}
        >
          <IoPeopleOutline /> {!collapse && "Emergency Contacts"}
        </div>

        <div style={{ marginTop: "120px" }}>
          <button
            onClick={handleLogout}
            className="logout"
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "#ef4444", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px" }}
          >
            <IoLogOutOutline /> {!collapse && "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;