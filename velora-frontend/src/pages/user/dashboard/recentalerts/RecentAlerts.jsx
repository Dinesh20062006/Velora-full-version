import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaExclamationTriangle } from "react-icons/fa";
import { getNotifications } from "../../../../api/notificationApi";

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const DEFAULT_TWO_ALERTS = [
  {
    id: "alert_1",
    title: "🚨 Emergency SOS Broadcasted",
    message: "Distress signal dispatched to Police Command and Emergency Helpline (112)",
    type: "ALERT",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    id: "alert_2",
    title: "⚠️ High-Risk Area Warning",
    message: "Increased safety alerts reported nearby. Safety protocol activated.",
    type: "WARNING",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString()
  }
];

function RecentAlerts({ alerts: propAlerts, loading: propLoading }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(
    Array.isArray(propAlerts) && propAlerts.length > 0 ? propAlerts : []
  );
  const [loading, setLoading] = useState(propLoading ?? false);

  useEffect(() => {
    let cancelled = false;

    if (Array.isArray(propAlerts) && propAlerts.length > 0) {
      return;
    }

    getNotifications()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
        if (list.length > 0) {
          setAlerts(list);
        } else {
          setAlerts(DEFAULT_TWO_ALERTS);
        }
      })
      .catch(() => {
        if (!cancelled) setAlerts(DEFAULT_TWO_ALERTS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [propAlerts]);

  // Display recent 2 alerts on the Home page
  const displayAlerts = (alerts && alerts.length > 0 ? alerts : DEFAULT_TWO_ALERTS).slice(0, 2);

  return (
    <div className="recent-alerts">
      <h2>Recent Alerts</h2>
      <div className="alert-list">
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Loading alerts...</p>
        ) : (
          displayAlerts.map((alert, idx) => {
            const isWarning = alert.status === "ACTIVE" || alert.type === "ALERT" || alert.type === "WARNING" || (alert.title && alert.title.includes("SOS"));
            const title = alert.title || (alert.status ? `SOS ${alert.status === "ACTIVE" ? "Active" : alert.status === "RESOLVED" ? "Resolved" : "Cancelled"}` : "Recent Alert");
            const message = alert.message || alert.address || "Location alert registered";
            const time = alert.createdAt || alert.triggeredAt;

            return (
              <div className="alert-card" key={alert.id || alert._id || idx}>
                {isWarning ? (
                  <FaExclamationTriangle className="alert-icon warning" />
                ) : (
                  <FaBell className="alert-icon" />
                )}
                <div className="alert-info">
                  <h3>{title}</h3>
                  <p>{message}</p>
                  <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "inline-block" }}>
                    {timeAgo(time)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <button className="view-btn" onClick={() => navigate("/notification")}>
        View All Alerts
      </button>
    </div>
  );
}

export default RecentAlerts;

