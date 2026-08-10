
import { useEffect, useState } from "react";
import UserLayout from "../../../layouts/UserLayout";

import {
    FiAlertTriangle,
    FiCheck,
    FiChevronRight,
    FiMapPin,
    FiStar,
    FiTrendingUp,
    FiBell
} from "react-icons/fi";
import BackButton from "../../../common/BackButton/BackButton";
import { getNotifications, markNotificationRead } from "../../../api/notificationApi";

const ICONS = {
    ALERT: { icon: FiAlertTriangle, className: "danger" },
    RISK_ZONE: { icon: FiAlertTriangle, className: "warning" },
    SAFETY_SCORE: { icon: FiStar, className: "success" },
    CONTACT: { icon: FiCheck, className: "success" },
    REPORT: { icon: FiTrendingUp, className: "info" },
    SAFE_ZONE: { icon: FiMapPin, className: "primary" },
};

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadNotify = () => {
            getNotifications()
                .then((res) => {
                    if (isMounted) {
                        const list = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
                        setNotifications(list);
                    }
                })
                .catch(() => {
                    if (isMounted) setError("Could not load notifications.");
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };

        loadNotify();
        const interval = setInterval(loadNotify, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleClick = async (n) => {
        if (n.read) return;
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        try {
            await markNotificationRead(n.id);
        } catch {
            // best effort; ignore failure
        }
    };

    return (
        <UserLayout>
          <BackButton />
          <div className="notification-page">
               <div className="notify-header">
                   <h1>Notifications</h1>
                </div>

                {error && (
                    <p style={{ color: "#ff4d4f" }}>{error}</p>
                )}

                {loading ? (
                    <p style={{ color: "#ffffff" }}>Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <div className="notify-menu-box">
                        <div className="notify-menu-item">
                            <div className="notify-menu-left">
                                <div className="notify-menu-icon info">
                                    <FiBell />
                                </div>
                                <div>
                                    <h3>You're all caught up</h3>
                                    <p>No notifications yet.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    notifications.map((n) => {
                        const meta = ICONS[n.type] || { icon: FiBell, className: "info" };
                        const Icon = meta.icon;
                        return (
                            <div className="notify-menu-box" key={n.id} onClick={() => handleClick(n)}>
                                <div className="notify-menu-item" style={{ opacity: n.read ? 0.6 : 1 }}>
                                    <div className="notify-menu-left">
                                        <div className={`notify-menu-icon ${meta.className}`}>
                                            <Icon />
                                        </div>
                                        <div>
                                            <h3>{n.title}</h3>
                                            <p>{n.message}</p>
                                            <span>{timeAgo(n.createdAt)}</span>
                                        </div>
                                    </div>
                                    <FiChevronRight className="notify-arrow"/>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </UserLayout>
    );
}
export default Notification;
