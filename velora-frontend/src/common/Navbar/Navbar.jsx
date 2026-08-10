import { useEffect, useState } from "react";
import { IoNotificationsOutline, IoPersonCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import velora_logo from "../../assets/logos/velora-icon.png";
import { getUnreadCount } from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";
import { getFileUrl } from "../../api/client";
import userAvatar from "../../assets/images/user.png";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = () => {
      getUnreadCount()
        .then((res) => {
          if (isMounted) {
            const count = typeof res?.data === "number" ? res.data : 0;
            setUnreadCount(count);
          }
        })
        .catch(() => {
          if (isMounted) setUnreadCount(0);
        });
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="top-navbar" style={{ background: "#111827", padding: "0 24px", height: "65px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937", zIndex: 1000, position: "fixed", top: 0, left: 0, right: 0, width: "100%" }}>
      <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          <img src={velora_logo} alt="Velora Logo" style={{ height: "32px", width: "auto", objectFit: "contain" }} />
          <span style={{ color: "#ec4899", fontWeight: "bold", fontSize: "18px", letterSpacing: "0.5px" }}>VELORA SAFETY PORTAL</span>
        </div>
      </div>

      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{ position: "relative", cursor: "pointer" }} onClick={() => navigate("/notification")}>
          <IoNotificationsOutline 
            style={{ fontSize: "24px", color: "#9ca3af", transition: "color 0.2s" }} 
          />
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-4px",
              right: "-6px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: "bold",
              borderRadius: "50%",
              padding: "2px 6px",
              lineHeight: 1
            }}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={() => navigate("/profile")}>
          <img
            src={userAvatar}
            alt="User Profile"
            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid #ec4899" }}
          />
          {user?.fullName && (
            <span style={{ color: "#e5e7eb", fontSize: "14px", fontWeight: "500" }}>
              {user.fullName.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;