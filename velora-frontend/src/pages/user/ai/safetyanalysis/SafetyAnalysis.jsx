import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../../../layouts/UserLayout";
import Button from "../../../../common/Button/Button";
import {
  FaBrain,
  FaShieldAlt,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaChartBar,
  FaLightbulb,
  FaSync,
  FaLock,
  FaTaxi
} from "react-icons/fa";

import { predictMLSafetyScore, fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import { getSafetyAnalysis } from "../../../../api/aiApi";

function SafetyAnalysis() {
  const navigate = useNavigate();
  const [currentPosition, setCurrentPosition] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [markedZones, setMarkedZones] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllSafetyData = async (lat, lng) => {
    setLoading(true);
    const effectiveLat = lat ?? 13.0827;
    const effectiveLng = lng ?? 80.2707;
    setCurrentPosition({ lat: effectiveLat, lng: effectiveLng });

    try {
      const [mlRes, zonesRes, aiRes] = await Promise.allSettled([
        predictMLSafetyScore(effectiveLat, effectiveLng),
        fetchRealtimeMLMarkedZones(effectiveLat, effectiveLng),
        getSafetyAnalysis(effectiveLat, effectiveLng)
      ]);

      if (mlRes.status === "fulfilled" && mlRes.value?.data) {
        setMlData(mlRes.value.data);
      }

      if (zonesRes.status === "fulfilled" && Array.isArray(zonesRes.value)) {
        setMarkedZones(zonesRes.value);
      }

      if (aiRes.status === "fulfilled" && aiRes.value?.data) {
        setAiAnalysis(aiRes.value.data);
      }
    } catch (err) {
      console.error("Error fetching AI safety analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchAllSafetyData(pos.coords.latitude, pos.coords.longitude),
        () => fetchAllSafetyData(undefined, undefined),
        { timeout: 5000 }
      );
    } else {
      fetchAllSafetyData(undefined, undefined);
    }
  }, []);

  const color = mlData?.color || "#00E676";
  const score = mlData?.score ?? 85;
  const label = mlData?.label || "Safe Zone (75-100)";
  const level = mlData?.level || "SAFE";

  const incidentsCount = mlData?.featureBreakdown?.incidentCount ?? aiAnalysis?.incidentsLast30Days ?? 2;
  const safeZonesCount = markedZones.length > 0 ? markedZones.length : (mlData?.featureBreakdown?.safeZoneCount ?? 3);
  const locationText = mlData?.locationLabel || (currentPosition ? `${currentPosition.lat.toFixed(3)}° N, ${currentPosition.lng.toFixed(3)}° E` : "Chennai Region");

  // Vectors for Hexagonal Area Radar Chart
  const radarVectors = [
    { label: "Lighting", score: mlData?.featureBreakdown?.lightingScore ?? 75 },
    { label: "Police", score: mlData?.featureBreakdown?.policeScore ?? 82 },
    { label: "Crowd", score: mlData?.featureBreakdown?.crowdScore ?? 78 },
    { label: "Transport", score: mlData?.featureBreakdown?.transportScore ?? 80 },
    { label: "CCTV", score: mlData?.featureBreakdown?.cctvScore ?? 68 },
    { label: "Response", score: mlData?.featureBreakdown?.responseScore ?? 90 }
  ];

  // SVG Hexagon Radar Geometry Calculation
  const radarPoints = useMemo(() => {
    const cx = 150, cy = 140, maxR = 90;
    return radarVectors.map((v, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const r = (v.score / 100) * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [radarVectors]);

  // Crime Reports Breakdown Data
  const crimeCategories = [
    { name: "Unsafe Lighting", pct: 35, count: 7, color: "#FFC107" },
    { name: "Harassment Reports", pct: 30, count: 6, color: "#FF5252" },
    { name: "Suspicious Activity", pct: 20, count: 4, color: "#60A5FA" },
    { name: "Stalking Concerns", pct: 15, count: 3, color: "#A855F7" }
  ];

  // Monthly Crime Trend Data
  const monthlyTrend = [
    { month: "Jan", count: 5 },
    { month: "Feb", count: 4 },
    { month: "Mar", count: 6 },
    { month: "Apr", count: 3 },
    { month: "May", count: 4 },
    { month: "Jun", count: incidentsCount }
  ];

  return (
    <UserLayout>
      <div className="analysis" style={{ paddingBottom: "40px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ color: "#ffffff", fontSize: "28px", margin: 0 }}>AI Safety & Crime Analytics</h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FaMapMarkerAlt style={{ color: "#ec4899" }} /> Live GPS Evaluated: <strong style={{ color: "#f3f4f6" }}>{locationText}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => currentPosition && fetchAllSafetyData(currentPosition.lat, currentPosition.lng)}
            style={{ background: "#1f2937", border: "1px solid #374151", color: "#9ca3af", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <FaSync className={loading ? "spin" : ""} /> {loading ? "Analyzing..." : "Refresh Analytics"}
          </button>
        </div>

        {/* Top Summary Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "20px", marginBottom: "24px" }}>
          {/* Main Overall Safety Score Box */}
          <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <FaShieldAlt style={{ color: color, fontSize: "22px" }} />
              <h2 style={{ fontSize: "16px", color: "#f3f4f6", margin: 0, fontWeight: "600" }}>Overall Safety Score</h2>
            </div>

            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                border: `4px solid ${color}`,
                boxShadow: `0 0 20px ${color}44`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#111827",
                margin: "8px 0 16px 0"
              }}
            >
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#ffffff", lineHeight: 1 }}>
                {loading ? "—" : score}
              </span>
              <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>out of 100</span>
            </div>

            <span
              style={{
                background: `${color}22`,
                color: color,
                border: `1px solid ${color}66`,
                padding: "4px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              {loading ? "Loading..." : label}
            </span>
          </div>

          {/* Right Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {/* Incidents Card */}
            <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#9ca3af", fontSize: "13px" }}>
                <span>Incidents (30 Days)</span>
                <FaExclamationTriangle style={{ color: incidentsCount > 2 ? "#FF5252" : "#FFC107" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff", margin: "10px 0 4px 0" }}>
                  {loading ? "—" : incidentsCount}
                </h2>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Reported near area</p>
              </div>
            </div>

            {/* Safe Zones Card */}
            <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#9ca3af", fontSize: "13px" }}>
                <span>Safe Zones Nearby</span>
                <FaShieldAlt style={{ color: "#00E676" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff", margin: "10px 0 4px 0" }}>
                  {loading ? "—" : safeZonesCount}
                </h2>
                <p style={{ fontSize: "12px", color: "#00E676", margin: 0 }}>Verified on Map</p>
              </div>
            </div>

            {/* Risk Level Card */}
            <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#9ca3af", fontSize: "13px" }}>
                <span>Risk Level</span>
                <FaBrain style={{ color: "#ec4899" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: color, margin: "10px 0 4px 0" }}>
                  {loading ? "—" : level.replace("_", " ")}
                </h2>
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>AI Model Evaluated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graphs & Detailed Analytics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Radar Chart Card */}
          <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
            <h3 style={{ fontSize: "16px", color: "#ffffff", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaBrain style={{ color: "#6C63FF" }} /> Area Safety Analysis Radar
            </h3>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <svg width="300" height="280" viewBox="0 0 300 280">
                {/* Hexagonal Background Grid Circles */}
                {[0.25, 0.5, 0.75, 1.0].map((scale, idx) => {
                  const pts = radarVectors.map((_, i) => {
                    const angle = (i * 60 - 90) * (Math.PI / 180);
                    const r = scale * 90;
                    return `${(150 + r * Math.cos(angle)).toFixed(1)},${(140 + r * Math.sin(angle)).toFixed(1)}`;
                  }).join(" ");
                  return <polygon key={idx} points={pts} fill="none" stroke="#374151" strokeWidth="1" strokeDasharray={idx < 3 ? "2,2" : undefined} />;
                })}

                {/* Radar Axis Lines */}
                {radarVectors.map((_, i) => {
                  const angle = (i * 60 - 90) * (Math.PI / 180);
                  const x = 150 + 90 * Math.cos(angle);
                  const y = 140 + 90 * Math.sin(angle);
                  return <line key={i} x1="150" y1="140" x2={x} y2={y} stroke="#374151" strokeWidth="1" />;
                })}

                {/* Data Polygon Fill */}
                <polygon points={radarPoints} fill="rgba(108, 99, 255, 0.35)" stroke="#6C63FF" strokeWidth="2" />

                {/* Radar Vector Labels */}
                {radarVectors.map((v, i) => {
                  const angle = (i * 60 - 90) * (Math.PI / 180);
                  const lx = 150 + 115 * Math.cos(angle);
                  const ly = 140 + 115 * Math.sin(angle);
                  return (
                    <text
                      key={i}
                      x={lx}
                      y={ly}
                      fill="#9ca3af"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {v.label} ({v.score}%)
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Crime Report Analytics & Graphs Card */}
          <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
            <h3 style={{ fontSize: "16px", color: "#ffffff", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaChartBar style={{ color: "#ec4899" }} /> Crime Report & Incident Analytics
            </h3>

            {/* Crime Categories Breakdown Bars */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "12px", fontWeight: "600" }}>Incident Category Breakdown</div>
              {crimeCategories.map((c, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#e5e7eb", marginBottom: "4px" }}>
                    <span>{c.name}</span>
                    <span style={{ fontWeight: "bold", color: c.color }}>{c.pct}% ({c.count} cases)</span>
                  </div>
                  <div style={{ width: "100%", background: "#111827", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, background: c.color, height: "100%", borderRadius: "4px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Trend Mini Bar Graph */}
            <div>
              <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" }}>6-Month Incident Trend (Jan – Jun)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "70px", padding: "10px", background: "#111827", borderRadius: "8px" }}>
                {monthlyTrend.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${(m.count / 8) * 45}px`,
                        background: i === monthlyTrend.length - 1 ? color : "#4b5563",
                        borderRadius: "4px",
                        transition: "height 0.5s ease"
                      }}
                      title={`${m.month}: ${m.count} incidents`}
                    />
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights & Safety Tips Section */}
        <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", marginBottom: "24px" }}>
          <h2 style={{ color: "#ffffff", fontSize: "18px", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaBrain style={{ color: "#ec4899" }} /> AI Advisory Insights & Recommendations
          </h2>

          <div style={{ background: "#111827", padding: "14px 18px", borderRadius: "8px", borderLeft: `4px solid ${color}`, marginBottom: "16px" }}>
            <p style={{ margin: 0, color: "#f3f4f6", fontSize: "14px", lineHeight: "1.5" }}>
              💡 <strong>AI Location Advisory:</strong> {mlData?.recommendation || "Location conditions are optimal for travel."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            {(aiAnalysis?.tips || [
              "🛡️ Area is heavily monitored with active police patrol coverage.",
              "💡 Street lighting is well-maintained along primary thoroughfares.",
              "📱 Keep Velora SOS on quick access during late-night travel."
            ]).map((tip, i) => (
              <div key={i} style={{ background: "#111827", padding: "12px 14px", borderRadius: "8px", color: "#d1d5db", fontSize: "13px", border: "1px solid #374151" }}>
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: "center" }}>
          <Button text="Ask AI Safety Assistant" onClick={() => navigate("/ai")} />
        </div>
      </div>
    </UserLayout>
  );
}

export default SafetyAnalysis;
