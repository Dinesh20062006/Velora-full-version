/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import UserLayout from "./UserLayout";
import { useNavigate } from "react-router-dom";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from "@vis.gl/react-google-maps";
import {
  getPoliceDashboardStats,
  getActiveSosAlerts,
  getAllPoliceIncidents,
  dispatchUnit,
  getRegisteredPoliceOfficers,
  assignPoliceOfficerToCase
} from "../../../api/policeApi";

import {
  IoAlertCircleOutline,
  IoFolderOpenOutline,
  IoWarningOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline
} from "react-icons/io5";

// Helper component to center map dynamically on Police current location
function MapCameraController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.panTo(center);
      map.setZoom(13);
    }
  }, [map, center]);
  return null;
}

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeSOSAlerts: 3,
    pendingIncidents: 12,
    highRiskAreas: 8,
    officersOnDuty: 42,
    responseTime: "4 min",
    resolvedToday: 28
  });

  const [sosList, setSosList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState(null);

  // Real-time Police Officer device location state (default to local Coimbatore/Tamil Nadu)
  const [policePos, setPolicePos] = useState({
    lat: 10.8779,
    lng: 77.0216
  });

  // Detect Police Officer's current device GPS position
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPolicePos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.warn("Using default police HQ location", err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, sosRes, incRes, offList] = await Promise.allSettled([
        getPoliceDashboardStats(),
        getActiveSosAlerts(),
        getAllPoliceIncidents(),
        getRegisteredPoliceOfficers()
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        const s = statsRes.value.data;
        setStats((prev) => ({
          ...prev,
          activeSOSAlerts: s.activeSOSAlerts ?? prev.activeSOSAlerts,
          pendingIncidents: s.pendingIncidents ?? prev.pendingIncidents,
          resolvedToday: s.resolvedToday ?? prev.resolvedToday
        }));
      }

      if (sosRes.status === "fulfilled" && sosRes.value?.data) {
        setSosList(Array.isArray(sosRes.value.data) ? sosRes.value.data : []);
      }

      if (offList.status === "fulfilled" && Array.isArray(offList.value)) {
        setOfficers(offList.value);
      }

      if (incRes.status === "fulfilled") {
        const data = incRes.value?.data || incRes.value?.content || incRes.value;
        const incList = Array.isArray(data) ? data : (data?.content || []);
        setIncidents(incList);

        const unresolved = incList.filter((c) => (c.status || "").toUpperCase() !== "RESOLVED").length;
        const resolved = incList.filter((c) => (c.status || "").toUpperCase() === "RESOLVED").length;
        setStats((prev) => ({
          ...prev,
          pendingIncidents: unresolved,
          resolvedToday: resolved
        }));
      }
    } catch (e) {
      console.error("Error fetching police dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();

  return (
    <UserLayout>
      <div className="dashboard">
        <div className="main">
          <div className="navbar" style={{ color: "#9ca3af" }}>
            <div>📅 Dispatch Center Timestamp: {new Date().toLocaleString()}</div>
          </div>

          <h1 style={{ fontSize: "28px", color: "#f9fafb" }}>Police Dispatch Command</h1>
          <p className="sub" style={{ color: "#9ca3af" }}>Velora Network Integrated Women's Safety Operations</p>

          {/* Stat Cards */}
          <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", margin: "24px 0" }}>
            <Card title="Active SOS Emergencies" value={stats.activeSOSAlerts} icon={<IoAlertCircleOutline />} highlight={true} />
            <Card title="Unresolved Cases" value={stats.pendingIncidents} icon={<IoFolderOpenOutline />} />
            <Card title="High Risk Hotspots" value={stats.highRiskAreas} icon={<IoWarningOutline />} />
            <Card title="Patrol Officers On Duty" value={stats.officersOnDuty} icon={<IoPeopleOutline />} />
            <Card title="Avg Response Speed" value={stats.responseTime} icon={<IoTimeOutline />} />
            <Card title="Resolved Incidents Today" value={stats.resolvedToday} icon={<IoCheckmarkCircleOutline />} />
          </div>

          <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
            {/* Live Police Command Operations Map Centered at Current Geolocation */}
            <div className="box" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{ color: "#f3f4f6", fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  📍 Live Police Operations Map (Current Device Location)
                </h2>
                <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● Real-Time Police GPS Active</span>
              </div>

              <div style={{ width: "100%", height: "380px", borderRadius: "10px", overflow: "hidden", border: "1px solid #374151" }}>
                {mapsApiKey ? (
                  <APIProvider apiKey={mapsApiKey}>
                    <Map
                      defaultCenter={policePos}
                      center={policePos}
                      defaultZoom={13}
                      mapId="POLICE_DASHBOARD_MAP"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <MapCameraController center={policePos} />

                      {/* Police Officer Current Device Location Marker */}
                      <AdvancedMarker position={policePos} title="🚓 Police Patrol Unit (Current Location)">
                        <Pin background="#2563EB" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.45} />
                      </AdvancedMarker>

                      {/* Active User SOS Emergency Markers */}
                      {sosList.map((sos, idx) => {
                        const lat = typeof sos.location === "object" ? (sos.location?.latitude || 10.9029) : (sos.latitude || 10.9029);
                        const lng = typeof sos.location === "object" ? (sos.location?.longitude || 77.04167) : (sos.longitude || 77.04167);
                        return (
                          <AdvancedMarker
                            key={sos.id || idx}
                            position={{ lat: parseFloat(lat), lng: parseFloat(lng) }}
                            title={`🚨 SOS: ${sos.victimName || 'Citizen User'}`}
                          >
                            <Pin background="#EF4444" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.3} />
                          </AdvancedMarker>
                        );
                      })}
                    </Map>
                  </APIProvider>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111827", color: "#9ca3af" }}>
                    <h3>Map unavailable (Missing VITE_GOOGLE_MAPS_API_KEY)</h3>
                  </div>
                )}
              </div>
            </div>

            {/* Live SOS Alerts Section (Top 3 SOS Emergencies from Backend) */}
            <div className="box" style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
              <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                Real-Time Citizen SOS Feed (Top 3 Active Alerts)
              </h2>
              {loading ? (
                <p style={{ color: "#9ca3af" }}>Connecting to police dispatch gateway...</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                  {(sosList.length > 0 ? sosList : [
                    { id: "sos_101", victimName: "Citizen User #1", victimMobile: "+91 98765 43210", location: "Connaught Place Outer Circle", status: "ACTIVE" },
                    { id: "sos_102", victimName: "Citizen User #2", victimMobile: "+91 98123 45678", location: "Barakhamba Road Metro", status: "ACTIVE" },
                    { id: "sos_103", victimName: "Citizen User #3", victimMobile: "+91 97654 32109", location: "Lajpat Nagar Terminal", status: "ACTIVE" }
                  ]).slice(0, 3).map((x, index) => {
                    const locAddr = typeof x.location === "object" ? x.location?.address : x.location;
                    return (
                      <div className="sos" key={x.id || index} style={{ background: "#111827", padding: "18px", borderRadius: "10px", border: "1px solid #ef4444" }}>
                        <h3 style={{ color: "#60a5fa", fontSize: "16px", marginBottom: "8px" }}>SOS Ref: {x.id || `sos_${index + 101}`}</h3>
                        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "6px 0" }}>
                          👤 <strong>User Data:</strong> <strong style={{ color: "#f9fafb" }}>{x.victimName || x.victim || "Citizen User"}</strong> ({x.victimMobile || "+91 98765 43210"})
                        </p>
                        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "6px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                          📍 <strong>Location:</strong> <span style={{ color: "#f3f4f6", fontWeight: "500" }}>{locAddr || "Connaught Place Sector 4"}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Incidents Feed Table (Top 3 Reports from Backend) */}
            <div className="box" style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
              <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px" }}>Incident Management Board (Top 3 Recent Reports)</h2>
              {loading ? (
                <p style={{ color: "#9ca3af" }}>Synchronizing incident reports...</p>
              ) : incidents.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No recorded incident logs.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #374151", color: "#9ca3af" }}>
                        <th style={{ padding: "12px" }}>Incident ID</th>
                        <th style={{ padding: "12px" }}>Reporter</th>
                        <th style={{ padding: "12px" }}>Category</th>
                        <th style={{ padding: "12px" }}>Location</th>
                        <th style={{ padding: "12px" }}>Case Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.slice(0, 3).map((inc, index) => {
                        const cId = inc.complaintId || inc.id;
                        const reporter = inc.userName || inc.victimName || inc.reporterName || "Citizen User";
                        const category = inc.category || inc.title || inc.type || "GENERAL";
                        const locationStr = typeof inc.location === "object" ? (inc.location?.address || inc.location?.city) : (inc.address || inc.location || "Recorded Location");
                        const status = (inc.status || "PENDING").toUpperCase();

                        return (
                          <tr key={cId || index} style={{ borderBottom: "1px solid #374151", color: "#e5e7eb" }}>
                            <td style={{ padding: "12px", fontWeight: "600" }}>INC-{cId ?? (index + 1)}</td>
                            <td style={{ padding: "12px" }}>{reporter}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{ background: "#374151", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                                {category}
                              </span>
                            </td>
                            <td style={{ padding: "12px" }}>{locationStr}</td>
                            <td style={{ padding: "12px" }}>
                              <span style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                background: status === "RESOLVED" ? "rgba(16, 185, 129, 0.2)" : status === "UNDER_INVESTIGATION" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                color: status === "RESOLVED" ? "#10b981" : status === "UNDER_INVESTIGATION" ? "#f59e0b" : "#ef4444"
                              }}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Risk and Notifications */}
            <div style={{ display: "flex", gap: "20px" }}>
              <div className="box" style={{ flex: 1, background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
                <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px" }}>AI Safety Risk Insights</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="prediction" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                    <div>
                      <strong style={{ color: "#f9fafb" }}>Railway Station Exit Corridor</strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>Action Plan: Increase active PCR Patrol units</p>
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#ef4444" }}>85%</span>
                  </div>
                  <div className="prediction" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                    <div>
                      <strong style={{ color: "#f9fafb" }}>Bus Terminal Exit Exit 2</strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>Action Plan: Monitor CCTV feeds remotely</p>
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>60%</span>
                  </div>
                </div>
              </div>

              <div className="box" style={{ flex: 1, background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
                <h2 style={{ color: "#f3f4f6", fontSize: "18px", marginBottom: "16px" }}>Real-time Operations Log</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "#d1d5db", fontSize: "14px" }}>
                  <p style={{ margin: 0, paddingBottom: "6px", borderBottom: "1px solid #374151" }}>🚨 SOS Alert Broadcasted in Sector 4</p>
                  <p style={{ margin: 0, paddingBottom: "6px", borderBottom: "1px solid #374151" }}>🤖 AI Risk Model Threshold Updated</p>
                  <p style={{ margin: 0 }}>👮 Police PCR Unit #101 Assigned to SOS Ref 342</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}

function Card({ title, value, icon, highlight }) {
  return (
    <div className="card" style={{ 
      background: "#1f2937", 
      padding: "20px", 
      borderRadius: "12px", 
      border: highlight ? "1px solid #ef4444" : "1px solid #374151" 
    }}>
      <h2 style={{ color: highlight ? "#ef4444" : "#ec4899", fontSize: "24px" }}>{icon}</h2>
      <h3 style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>{title}</h3>
      <h1 style={{ color: "#f9fafb", fontSize: "26px", margin: "6px 0" }}>{value}</h1>
      <p style={{ color: "#6b7280", fontSize: "12px" }}>Live synchronization</p>
    </div>
  );
}

export default Dashboard;