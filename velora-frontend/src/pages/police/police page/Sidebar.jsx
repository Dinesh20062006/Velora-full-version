import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
  IoHomeOutline,
  IoAlertCircleOutline,
  IoFolderOpenOutline,
  IoMapOutline,
  IoBarChartOutline,
  IoLogOutOutline,
} from "react-icons/io5";

function Sidebar({ collapse }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/police/login");
  };

  return (
    <div className={collapse ? "sidebar small" : "sidebar"}>
      <div className="SidebarAlign">
        <Link
          to="/police/dashboard"
          className={`menu ${location.pathname === "/police/dashboard" || location.pathname === "/police" ? "active" : ""}`}
        >
          <IoHomeOutline /> {!collapse && "Dashboard"}
        </Link>

        <Link
          to="/police/recentcase"
          className={`menu ${location.pathname === "/police/recentcase" ? "active" : ""}`}
        >
          <IoAlertCircleOutline /> {!collapse && "Recent Case"}
        </Link>

        <Link
          to="/police/pendingcases"
          className={`menu ${location.pathname === "/police/pendingcases" ? "active" : ""}`}
        >
          <IoFolderOpenOutline /> {!collapse && "Incident Management"}
        </Link>

        <Link
          to="/police/riskzone"
          className={`menu ${location.pathname === "/police/riskzone" ? "active" : ""}`}
        >
          <IoMapOutline /> {!collapse && "Riskzone"}
        </Link>

        <Link
          to="/police/todayscase"
          className={`menu ${location.pathname === "/police/todayscase" ? "active" : ""}`}
        >
          <IoBarChartOutline /> {!collapse && "Analytics"}
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

export default Sidebar;