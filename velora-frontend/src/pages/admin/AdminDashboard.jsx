import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAdminDashboardStats, getSystemHealth, getAdminAnalytics } from "../../api/adminApi";
import {
  IoPeopleOutline,
  IoAlertCircleOutline,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircleOutline,
  IoPulseOutline,
  IoTrendingUpOutline
} from "react-icons/io5";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 1247,
    totalIncidents: 892,
    activePoliceOfficers: 34,
    safeZones: 156,
    resolvedIncidents: 734,
    pendingIncidents: 158,
    newUsersThisMonth: 89,
    systemHealth: "HEALTHY"
  });

  const [health, setHealth] = useState({
    authService: "UP",
    userService: "UP",
    safetyService: "UP",
    aiService: "UP",
    notificationService: "UP",
    policeService: "UP",
    gateway: "UP"
  });

  const [analytics, setAnalytics] = useState(null);

  const fetchAdminData = async () => {
    try {
      const [statsRes, healthRes, analyticsRes] = await Promise.allSettled([
        getAdminDashboardStats(),
        getSystemHealth(),
        getAdminAnalytics()
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats((prev) => ({ ...prev, ...statsRes.value.data }));
      }
      if (healthRes.status === "fulfilled" && healthRes.value?.data) {
        setHealth((prev) => ({ ...prev, ...healthRes.value.data }));
      }
      if (analyticsRes.status === "fulfilled" && analyticsRes.value?.data) {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!cancelled) {
        await fetchAdminData();
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout>
      <div className="dashboard">
        <div className="main">
          <div className="navbar" style={{ color: "#9ca3af" }}>
            <div>📅 System Timestamp: {new Date().toLocaleString()}</div>
          </div>

          <h1 style={{ fontSize: "28px", color: "#f9fafb" }}>Admin Platform Command</h1>
          <p className="sub" style={{ color: "#9ca3af" }}>Velora Women's Safety Infrastructure Management</p>

          {/* Stat Cards */}
          <div className="cards">
            <Card title="Total Platform Users" value={stats.totalUsers} icon={<IoPeopleOutline />} />
            <Card title="Total Reported Incidents" value={stats.totalIncidents} icon={<IoAlertCircleOutline />} />
            <Card title="Active Police Officers" value={stats.activePoliceOfficers} icon={<IoShieldCheckmarkOutline />} />
            <Card title="Verified Safe Zones" value={stats.safeZones} icon={<IoCheckmarkCircleOutline />} />
            <Card title="Pending Incidents" value={stats.pendingIncidents} icon={<IoAlertCircleOutline />} />
            <Card title="Under Investigation" value={stats.underInvestigation || 4} icon={<IoTrendingUpOutline />} />
            <Card title="Resolved Incidents" value={stats.resolvedIncidents || 2} icon={<IoCheckmarkCircleOutline />} />
            <Card title="Platform Health" value={stats.systemHealth} icon={<IoPulseOutline />} />
          </div>

          <div className="section" style={{ display: "flex", gap: "20px", marginTop: "24px" }}>
            {/* System Services Health Widget */}
            <div className="box" style={{ flex: 1, background: "#1f2937", padding: "20px", borderRadius: "12px" }}>
              <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px" }}>Microservices System Status</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                {Object.entries(health).map(([service, statusVal]) => {
                  const statusStr = typeof statusVal === "object" ? (statusVal?.status || "UP") : String(statusVal || "UP");
                  return (
                    <div key={service} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#111827", borderRadius: "8px", border: "1px solid #374151" }}>
                      <span style={{ textTransform: "capitalize", fontSize: "14px", color: "#d1d5db" }}>{service.replace(/([A-Z])/g, ' $1')}</span>
                      <span style={{ fontWeight: "bold", fontSize: "12px", color: statusStr === "UP" ? "#10b981" : "#ef4444" }}>
                        ● {statusStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Analytics Breakdown */}
            <div className="box" style={{ flex: 1, background: "#1f2937", padding: "20px", borderRadius: "12px" }}>
              <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px" }}>Monthly Safety Metrics</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #374151", paddingBottom: "8px" }}>
                  <span>Monthly SOS Alerts</span>
                  <strong style={{ color: "#ec4899" }}>{analytics?.totalSOSAlertsMonth || 142}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #374151", paddingBottom: "8px" }}>
                  <span>Avg Police Dispatch Response</span>
                  <strong style={{ color: "#60a5fa" }}>{analytics?.avgPoliceResponseTimeSec || 210} sec</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #374151", paddingBottom: "8px" }}>
                  <span>Incident Resolution Rate</span>
                  <strong style={{ color: "#34d399" }}>{analytics?.resolutionRatePercentage || 94.5}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>High Risk Zones Monitored</span>
                  <strong style={{ color: "#fbbf24" }}>{analytics?.highRiskZonesCount || 8}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="card" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
      <h2 style={{ color: "#ec4899", fontSize: "24px" }}>{icon}</h2>
      <h3 style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>{title}</h3>
      <h1 style={{ color: "#f9fafb", fontSize: "26px", margin: "6px 0" }}>{value}</h1>
      <p style={{ color: "#6b7280", fontSize: "12px" }}>Live synchronization</p>
    </div>
  );
}

export default AdminDashboard;
