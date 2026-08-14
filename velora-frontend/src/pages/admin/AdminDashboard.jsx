import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAdminDashboardStats } from "../../api/adminApi";
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
    totalUsers: 0,
    totalIncidents: 0,
    activePoliceOfficers: 0,
    safeZones: 0,
    resolvedIncidents: 0,
    pendingIncidents: 0,
    underInvestigation: 0,
    newUsersThisMonth: 0,
    systemHealth: "LOADING"
  });

  const fetchAdminData = async () => {
    try {
      const statsRes = await getAdminDashboardStats();
      if (statsRes?.data) {
        setStats((prev) => ({ ...prev, ...statsRes.data }));
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
            <Card title="Under Investigation" value={stats.underInvestigation || 0} icon={<IoTrendingUpOutline />} />
            <Card title="Resolved Incidents" value={stats.resolvedIncidents || 0} icon={<IoCheckmarkCircleOutline />} />
            <Card title="Platform Health" value={stats.systemHealth} icon={<IoPulseOutline />} />
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
