import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  IoHomeOutline,
  IoPeopleOutline,
  IoShieldCheckmarkOutline,
  IoPulseOutline,
  IoLogOutOutline,
  IoDocumentTextOutline
} from "react-icons/io5";

function AdminSidebar({ collapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={collapse ? "sidebar small" : "sidebar"}>
      <div className="SidebarAlign">
        <Link
          to="/admin/dashboard"
          className={`menu ${location.pathname === "/admin/dashboard" || location.pathname === "/admin" ? "active" : ""}`}
        >
          <IoHomeOutline /> {!collapse && "Dashboard"}
        </Link>

        <Link
          to="/admin/users"
          className={`menu ${location.pathname === "/admin/users" ? "active" : ""}`}
        >
          <IoPeopleOutline /> {!collapse && "User Management"}
        </Link>

        <Link
          to="/admin/safezones"
          className={`menu ${location.pathname === "/admin/safezones" ? "active" : ""}`}
        >
          <IoShieldCheckmarkOutline /> {!collapse && "Safe Zones"}
        </Link>

        <Link
          to="/admin/health"
          className={`menu ${location.pathname === "/admin/health" ? "active" : ""}`}
        >
          <IoPulseOutline /> {!collapse && "System Health"}
        </Link>

        <div style={{ marginTop: "120px" }}>
          <button
            onClick={handleLogout}
            className="logout"
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "#ef4444" }}
          >
            <IoLogOutOutline /> {!collapse && "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSidebar;
