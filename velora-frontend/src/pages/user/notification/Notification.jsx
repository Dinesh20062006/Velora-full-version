import { useEffect, useState, useMemo } from "react";
import UserLayout from "../../../layouts/UserLayout";

import {
    FiAlertTriangle,
    FiCheck,
    FiChevronRight,
    FiMapPin,
    FiStar,
    FiTrendingUp,
    FiBell,
    FiSearch,
    FiCheckCircle,
    FiShield
} from "react-icons/fi";
import BackButton from "../../../common/BackButton/BackButton";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../../api/notificationApi";

const ICONS = {
    SOS: { icon: FiAlertTriangle, className: "danger" },
    ALERT: { icon: FiAlertTriangle, className: "danger" },
    RISK_ZONE: { icon: FiAlertTriangle, className: "warning" },
    SAFETY_SCORE: { icon: FiStar, className: "success" },
    CONTACT: { icon: FiCheck, className: "success" },
    REPORT: { icon: FiTrendingUp, className: "info" },
    SAFE_ZONE: { icon: FiMapPin, className: "primary" },
    SYSTEM: { icon: FiShield, className: "info" }
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

// Map notification to filter category
const getCategory = (n) => {
    if (n.type === "ALERT" || n.type === "WARNING") return "ALERT";
    if (n.type === "REPORT") return "REPORT";
    return "ALERT";
};

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadNotify = () => {
            getNotifications()
                .then((res) => {
                    if (isMounted) {
                        const list = Array.isArray(res?.data) ? res.data : [];
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
        window.addEventListener("notifications_updated", loadNotify);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener("notifications_updated", loadNotify);
        };
    }, []);

    const handleClick = async (n) => {
        if (n.read) return;
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        try {
            await markNotificationRead(n.id);
        } catch {
            // best effort
        }
    };

    const handleMarkAllRead = async () => {
        const ids = notifications.map((n) => n.id);
        setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
        try {
            await markAllNotificationsRead(ids);
        } catch {
            // best effort
        }
    };

    // Calculate category counts (All, Alerts, Incident Reports)
    const categoryCounts = useMemo(() => {
        const counts = { ALL: notifications.length, ALERT: 0, REPORT: 0 };
        notifications.forEach((n) => {
            const cat = getCategory(n);
            if (counts[cat] !== undefined) {
                counts[cat]++;
            } else {
                counts.ALERT++;
            }
        });
        return counts;
    }, [notifications]);

    // Filter notifications based on active category tab & search query
    const filteredNotifications = useMemo(() => {
        return notifications.filter((n) => {
            // Category filter
            if (activeFilter !== "ALL") {
                const cat = getCategory(n);
                if (cat !== activeFilter) return false;
            }
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = n.title && n.title.toLowerCase().includes(q);
                const msgMatch = n.message && n.message.toLowerCase().includes(q);
                if (!titleMatch && !msgMatch) return false;
            }
            return true;
        });
    }, [notifications, activeFilter, searchQuery]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    return (
        <UserLayout>
            <BackButton />
            <div className="notification-page">
                {/* Header */}
                <div className="notify-header">
                    <div>
                        <h1>Notifications</h1>
                        <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
                            Stay updated with safety alerts and reports.
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button className="notify-mark-read-btn" onClick={handleMarkAllRead}>
                            <FiCheckCircle /> Mark all read ({unreadCount})
                        </button>
                    )}
                </div>

                {error && (
                    <p style={{ color: "#ff4d4f", marginBottom: "15px" }}>{error}</p>
                )}

                {/* Search & Filter Bar */}
                <div className="notify-filter-wrapper">
                    <div className="notify-search-bar">
                        <FiSearch className="notify-search-icon" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="notify-filter-tabs">
                        <button
                            className={`notify-filter-btn ${activeFilter === "ALL" ? "active" : ""}`}
                            onClick={() => setActiveFilter("ALL")}
                        >
                            <FiBell /> All
                            <span className="notify-tab-badge">{categoryCounts.ALL}</span>
                        </button>

                        <button
                            className={`notify-filter-btn ${activeFilter === "ALERT" ? "active" : ""}`}
                            onClick={() => setActiveFilter("ALERT")}
                        >
                            <FiAlertTriangle /> Alerts
                            <span className="notify-tab-badge">{categoryCounts.ALERT}</span>
                        </button>

                        <button
                            className={`notify-filter-btn ${activeFilter === "REPORT" ? "active" : ""}`}
                            onClick={() => setActiveFilter("REPORT")}
                        >
                            <FiTrendingUp /> Incident Reports
                            <span className="notify-tab-badge">{categoryCounts.REPORT}</span>
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="notify-menu-box">
                        <div className="notify-menu-item">
                            <p style={{ color: "#ffffff", padding: "10px" }}>Loading notifications...</p>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="notify-menu-box">
                        <div className="notify-menu-item empty-state">
                            <div className="notify-menu-left">
                                <div className="notify-menu-icon info">
                                    <FiBell />
                                </div>
                                <div>
                                    <h3>No notifications found</h3>
                                    <p>
                                        {searchQuery
                                            ? `No notifications matching "${searchQuery}"`
                                            : activeFilter !== "ALL"
                                            ? `No ${activeFilter.toLowerCase()} notifications at this time.`
                                            : "You're all caught up! No notifications yet."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredNotifications.map((n) => {
                        const meta = ICONS[n.type] || { icon: FiBell, className: "info" };
                        const Icon = meta.icon;
                        return (
                            <div className="notify-menu-box" key={n.id} onClick={() => handleClick(n)}>
                                <div 
                                    className={`notify-menu-item ${n.read ? "read" : "unread"}`}
                                >
                                    <div className="notify-menu-left">
                                        <div className={`notify-menu-icon ${meta.className}`}>
                                            <Icon />
                                        </div>
                                        <div>
                                            <div className="notify-title-row">
                                                <h3>{n.title}</h3>
                                                {!n.read && <span className="unread-dot">• Unread</span>}
                                            </div>
                                            <p>{n.message}</p>
                                            <span className="notify-time">{timeAgo(n.createdAt)}</span>
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
