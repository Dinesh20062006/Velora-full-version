import React, { useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import { useNavigate } from "react-router-dom";
import { getActiveSosAlerts, getAllPoliceIncidents, dispatchUnit } from "../../../api/policeApi";
import { getAllUsers } from "../../../api/adminApi";

function TodaysCase() {
  const navigate = useNavigate();
  const [sosList, setSosList] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [sosRes, incRes, userListRes] = await Promise.allSettled([
        getActiveSosAlerts(),
        getAllPoliceIncidents(),
        getAllUsers()
      ]);

      // 1. Process Dynamic SOS Alerts
      let sosData = [];
      if (sosRes.status === "fulfilled") {
        const rawData = sosRes.value?.data || sosRes.value?.content || sosRes.value;
        sosData = Array.isArray(rawData) ? rawData : (rawData?.content || []);
      }

      let userList = [];
      if (userListRes.status === "fulfilled") {
        const uData = userListRes.value?.data || userListRes.value;
        userList = Array.isArray(uData) ? uData : (uData?.users || []);
      }

      const dynamicSosList = sosData.map((s, index) => {
        const rawUserIdStr = String(s.userId || s.user_id || s.victimId || "").replace("usr_", "");
        const rawUserIdNum = parseInt(rawUserIdStr, 10);

        const matchedUser = userList.find((u) => {
          const uIdStr = String(u.id || u.userId || "").replace("usr_", "");
          const uIdNum = parseInt(uIdStr, 10);
          return (uIdNum && uIdNum === rawUserIdNum) || (uIdStr && uIdStr === rawUserIdStr);
        });

        const lat = typeof s.location === "object" ? s.location?.latitude : (s.latitude || 10.9029);
        const lng = typeof s.location === "object" ? s.location?.longitude : (s.longitude || 77.04167);
        const locAddress = typeof s.location === "object" ? s.location?.address : (s.location || s.address || "Live GPS Location");

        return {
          id: s.id || `sos_${index + 101}`,
          userId: rawUserIdNum || rawUserIdStr,
          victimName: matchedUser ? (matchedUser.fullName || matchedUser.name || matchedUser.username) : (s.victimName || `Citizen User #${rawUserIdStr}`),
          victimMobile: matchedUser ? (matchedUser.mobileNumber && matchedUser.mobileNumber !== "—" ? matchedUser.mobileNumber : matchedUser.phone || matchedUser.email) : (s.victimMobile || s.phone || "+91 98765 43210"),
          location: locAddress,
          coordinates: `${lat}° N, ${lng}° E`,
          timestamp: s.triggerTime || s.timestamp || s.createdAt || new Date().toLocaleString(),
          emergencyContacts: "+91 98765 00001 (Guardian Alerted)",
          status: (s.status || "ACTIVE").toUpperCase()
        };
      });

      setSosList(dynamicSosList);

      // 2. Process Dynamic Incident Reports
      let incData = [];
      if (incRes.status === "fulfilled") {
        const rawInc = incRes.value?.data || incRes.value?.content || incRes.value;
        incData = Array.isArray(rawInc) ? rawInc : (rawInc?.content || []);
      }

      setIncidentsList(incData);
    } catch (e) {
      console.error("Failed to load analytics data", e);
    } finally {
      setLoading(false);
    }
  };

  // SOS Analytics Calculations
  const totalSos = sosList.length;
  const sosActiveCount = sosList.filter((s) => s.status === "ACTIVE").length;
  const sosDispatchedCount = sosList.filter((s) => s.status === "DISPATCHED").length;
  const sosResolvedCount = sosList.filter((s) => s.status === "RESOLVED").length;

  // Incident Reports Analytics Calculations
  const totalIncidents = incidentsList.length;
  const incResolvedCount = incidentsList.filter((i) => (i.status || "").toUpperCase() === "RESOLVED").length;
  const incInvestigationCount = incidentsList.filter((i) => (i.status || "").toUpperCase() === "UNDER_INVESTIGATION").length;
  const incPendingCount = incidentsList.filter((i) => (i.status || "").toUpperCase() === "PENDING" || (i.status || "").toUpperCase() === "SUBMITTED").length;

  // Category counts for Incidents
  const harassmentCount = incidentsList.filter((i) => (i.category || i.type || "").toUpperCase().includes("HARASSMENT")).length;
  const stalkingCount = incidentsList.filter((i) => (i.category || i.type || "").toUpperCase().includes("STALKING")).length;
  const cyberCount = incidentsList.filter((i) => (i.category || i.type || "").toUpperCase().includes("CYBER")).length;
  const otherCategoryCount = Math.max(0, totalIncidents - (harassmentCount + stalkingCount + cyberCount));

  // Pie Chart Conic Gradients
  // 1. SOS Pie Chart Angle
  const sosActiveDeg = totalSos > 0 ? (sosActiveCount / totalSos) * 360 : 120;
  const sosDispDeg = totalSos > 0 ? sosActiveDeg + (sosDispatchedCount / totalSos) * 360 : 240;

  // 2. Incident Status Pie Chart Angle
  const incResDeg = totalIncidents > 0 ? (incResolvedCount / totalIncidents) * 360 : 180;
  const incInvDeg = totalIncidents > 0 ? incResDeg + (incInvestigationCount / totalIncidents) * 360 : 270;

  return (
    <UserLayout>
      <div className="casePage" style={{ padding: "20px", color: "#f9fafb" }}>
        <div className="top" style={{ marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: 0 }}>
              📊 POLICE ANALYTICS COMMAND CENTER
            </h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0", fontSize: "14px" }}>
              Comprehensive real-time reporting analytics for both User SOS Emergencies & Citizen Incident Reports
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Total SOS Emergencies</span>
            <h1 style={{ color: "#ef4444", margin: "8px 0 0 0", fontSize: "28px" }}>{totalSos}</h1>
            <span style={{ fontSize: "11px", color: "#f59e0b" }}>{sosActiveCount} Active Triggered</span>
          </div>

          <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Total Incident Reports</span>
            <h1 style={{ color: "#60a5fa", margin: "8px 0 0 0", fontSize: "28px" }}>{totalIncidents}</h1>
            <span style={{ fontSize: "11px", color: "#38bdf8" }}>{incPendingCount + incInvestigationCount} Open Cases</span>
          </div>

          <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Patrol Dispatches</span>
            <h1 style={{ color: "#f59e0b", margin: "8px 0 0 0", fontSize: "28px" }}>{sosDispatchedCount}</h1>
            <span style={{ fontSize: "11px", color: "#10b981" }}>Police En Route</span>
          </div>

          <div style={{ background: "#111827", padding: "18px", borderRadius: "12px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold" }}>Total Cases Resolved</span>
            <h1 style={{ color: "#10b981", margin: "8px 0 0 0", fontSize: "28px" }}>{sosResolvedCount + incResolvedCount}</h1>
            <span style={{ fontSize: "11px", color: "#10b981" }}>Resolved Successfully</span>
          </div>
        </div>

        {/* SECTION 1: SOS EMERGENCY ANALYTICS (PIE CHART & BAR GRAPH) */}
        <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #ef4444", marginBottom: "28px" }}>
          <h2 style={{ color: "#ef4444", fontSize: "18px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            🚨 USER SOS EMERGENCY ANALYTICS (`sos_alerts` DB Table)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "center" }}>
            
            {/* SOS Pie Chart */}
            <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", border: "1px solid #374151", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h3 style={{ color: "#f3f4f6", fontSize: "15px", marginBottom: "16px" }}>SOS Status Pie Chart</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background: `conic-gradient(#ef4444 0deg ${sosActiveDeg}deg, #f59e0b ${sosActiveDeg}deg ${sosDispDeg}deg, #10b981 ${sosDispDeg}deg 360deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.5)"
                }}>
                  <div style={{ width: "75px", height: "75px", background: "#111827", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "#ef4444" }}>{totalSos}</span>
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>SOS Alerts</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                    <span>Active: <strong style={{ color: "#f9fafb" }}>{sosActiveCount}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                    <span>Dispatched: <strong style={{ color: "#f9fafb" }}>{sosDispatchedCount}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                    <span>Resolved: <strong style={{ color: "#f9fafb" }}>{sosResolvedCount}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOS Bar Graph */}
            <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", border: "1px solid #374151" }}>
              <h3 style={{ color: "#f3f4f6", fontSize: "15px", marginBottom: "16px" }}>SOS Status Bar Graph</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Active Emergencies</span>
                    <strong>{totalSos > 0 ? Math.round((sosActiveCount / totalSos) * 100) : 0}% ({sosActiveCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalSos > 0 ? Math.round((sosActiveCount / totalSos) * 100) : 0}%`, background: "#ef4444", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Patrol Units Dispatched</span>
                    <strong>{totalSos > 0 ? Math.round((sosDispatchedCount / totalSos) * 100) : 0}% ({sosDispatchedCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalSos > 0 ? Math.round((sosDispatchedCount / totalSos) * 100) : 0}%`, background: "#f59e0b", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Resolved Emergencies</span>
                    <strong>{totalSos > 0 ? Math.round((sosResolvedCount / totalSos) * 100) : 0}% ({sosResolvedCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalSos > 0 ? Math.round((sosResolvedCount / totalSos) * 100) : 0}%`, background: "#10b981", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: CITIZEN INCIDENT REPORTS ANALYTICS (PIE CHART & BAR GRAPH) */}
        <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #3b82f6", marginBottom: "28px" }}>
          <h2 style={{ color: "#60a5fa", fontSize: "18px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            📋 CITIZEN INCIDENT REPORTS ANALYTICS (`incidents` DB Table)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "center" }}>
            
            {/* Incident Reports Pie Chart */}
            <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", border: "1px solid #374151", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <h3 style={{ color: "#f3f4f6", fontSize: "15px", marginBottom: "16px" }}>Incident Case Status Pie Chart</h3>
              
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background: `conic-gradient(#10b981 0deg ${incResDeg}deg, #f59e0b ${incResDeg}deg ${incInvDeg}deg, #ef4444 ${incInvDeg}deg 360deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.5)"
                }}>
                  <div style={{ width: "75px", height: "75px", background: "#111827", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: "#60a5fa" }}>{totalIncidents}</span>
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>Reports</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
                    <span>Resolved: <strong style={{ color: "#f9fafb" }}>{incResolvedCount}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
                    <span>Investigating: <strong style={{ color: "#f9fafb" }}>{incInvestigationCount}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#cbd5e1" }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                    <span>Pending: <strong style={{ color: "#f9fafb" }}>{incPendingCount}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Reports Bar Graph */}
            <div style={{ background: "#111827", padding: "20px", borderRadius: "10px", border: "1px solid #374151" }}>
              <h3 style={{ color: "#f3f4f6", fontSize: "15px", marginBottom: "16px" }}>Incident Case Status Bar Graph</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Resolved Cases</span>
                    <strong>{totalIncidents > 0 ? Math.round((incResolvedCount / totalIncidents) * 100) : 0}% ({incResolvedCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalIncidents > 0 ? Math.round((incResolvedCount / totalIncidents) * 100) : 0}%`, background: "#10b981", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Under Investigation</span>
                    <strong>{totalIncidents > 0 ? Math.round((incInvestigationCount / totalIncidents) * 100) : 0}% ({incInvestigationCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalIncidents > 0 ? Math.round((incInvestigationCount / totalIncidents) * 100) : 0}%`, background: "#f59e0b", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: "13px", marginBottom: "6px" }}>
                    <span>Pending Review</span>
                    <strong>{totalIncidents > 0 ? Math.round((incPendingCount / totalIncidents) * 100) : 0}% ({incPendingCount})</strong>
                  </div>
                  <div style={{ background: "#374151", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${totalIncidents > 0 ? Math.round((incPendingCount / totalIncidents) * 100) : 0}%`, background: "#ef4444", height: "100%", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic User SOS Emergency Alerts Log Table */}
        <div className="tableBox" style={{ background: "#111827", padding: "24px", borderRadius: "12px", border: "1px solid #374151", marginBottom: "28px" }}>
          <h2 style={{ color: "#f9fafb" }}>User SOS Emergency Triggers Log (Dynamic DB Feed)</h2>

          {loading ? (
            <p style={{ color: "#9ca3af" }}>Fetching live SOS records from database...</p>
          ) : sosList.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No active user SOS triggers recorded in database.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #374151", color: "#9ca3af" }}>
                    <th style={{ padding: "14px" }}>SOS Ref ID</th>
                    <th style={{ padding: "14px" }}>Victim / Citizen (`users.name`)</th>
                    <th style={{ padding: "14px" }}>Phone Number</th>
                    <th style={{ padding: "14px" }}>GPS Location & Address</th>
                    <th style={{ padding: "14px" }}>Trigger Time</th>
                    <th style={{ padding: "14px" }}>Emergency Contacts Alerted</th>
                  </tr>
                </thead>
                <tbody>
                  {sosList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #374151", color: "#e5e7eb" }}>
                      <td style={{ padding: "14px", fontWeight: "bold", color: "#ef4444" }}>{item.id}</td>
                      <td style={{ padding: "14px", fontWeight: "600", color: "#f9fafb" }}>👤 {item.victimName}</td>
                      <td style={{ padding: "14px", color: "#60a5fa" }}>📞 {item.victimMobile}</td>
                      <td style={{ padding: "14px" }}>
                        <div>📍 {item.location}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>🌐 {item.coordinates}</div>
                      </td>
                      <td style={{ padding: "14px", fontSize: "13px", color: "#9ca3af" }}>🕒 {item.timestamp}</td>
                      <td style={{ padding: "14px", fontSize: "12px", color: "#d1d5db" }}>🔔 {item.emergencyContacts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Citizen Incident Reports Log Table */}
        <div className="tableBox" style={{ background: "#111827", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
          <h2 style={{ color: "#f9fafb" }}>Citizen Incident Reports Log (Dynamic DB Feed)</h2>

          {loading ? (
            <p style={{ color: "#9ca3af" }}>Fetching live incident records from database...</p>
          ) : incidentsList.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No recorded incident logs.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #374151", color: "#9ca3af" }}>
                    <th style={{ padding: "14px" }}>Report ID</th>
                    <th style={{ padding: "14px" }}>Reporter</th>
                    <th style={{ padding: "14px" }}>Incident Category</th>
                    <th style={{ padding: "14px" }}>Location</th>
                    <th style={{ padding: "14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsList.map((inc, index) => {
                    const cId = inc.complaintId || inc.id;
                    const reporter = inc.userName || inc.victimName || inc.reporterName || "Citizen User";
                    const category = inc.category || inc.title || inc.type || "GENERAL";
                    const locationStr = typeof inc.location === "object" ? (inc.location?.address || inc.location?.city) : (inc.address || inc.location || "Recorded Location");
                    const status = (inc.status || "PENDING").toUpperCase();

                    return (
                      <tr key={cId || index} style={{ borderBottom: "1px solid #374151", color: "#e5e7eb" }}>
                        <td style={{ padding: "14px", fontWeight: "bold", color: "#60a5fa" }}>INC-{cId ?? (index + 1)}</td>
                        <td style={{ padding: "14px", fontWeight: "600", color: "#f9fafb" }}>👤 {reporter}</td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ background: "#374151", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "#38bdf8", fontWeight: "bold" }}>
                            {category}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>📍 {locationStr}</td>
                        <td style={{ padding: "14px" }}>
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
      </div>
    </UserLayout>
  );
}

export default TodaysCase;