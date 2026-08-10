import { useEffect, useState } from "react";
import { FaBrain, FaClock, FaSync, FaMapMarkerAlt } from "react-icons/fa";
import { predictMLSafetyScore } from "../../../../api/mlSafetyApi";

function MLSafetyCard({ lat, lng }) {
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);

  const runMLPrediction = async () => {
    setLoading(true);
    try {
      const res = await predictMLSafetyScore(lat, lng);
      setMlData(res?.data || null);
    } catch (err) {
      console.error("ML Prediction Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadPrediction() {
      setLoading(true);
      try {
        const res = await predictMLSafetyScore(lat, lng);
        if (!cancelled) {
          setMlData(res?.data || null);
        }
      } catch (err) {
        console.error("ML Prediction Error:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadPrediction();
    return () => { cancelled = true; };
  }, [lat, lng]);

  const color = mlData?.color || "#00E676";
  const locationText = mlData?.locationLabel || (lat != null && lng != null ? `${lat.toFixed(3)}° N, ${lng.toFixed(3)}° E` : "Map Sector");

  return (
    <div className="ml-safety-card" style={{ background: "#1f2937", borderRadius: "12px", padding: "20px", border: "1px solid #374151", color: "#f3f4f6" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaBrain style={{ color: "#ec4899", fontSize: "22px" }} />
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#ffffff" }}>ML Predictive Safety Intelligence</h3>
            <span style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
              <FaMapMarkerAlt style={{ color: "#ec4899", fontSize: "10px" }} /> Map Location: <strong style={{ color: "#e5e7eb" }}>{locationText}</strong>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={runMLPrediction}
          title="Re-run ML Model Prediction for Map Coordinates"
          style={{ background: "#374151", border: "none", color: "#9ca3af", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
        >
          <FaSync className={loading ? "spin" : ""} /> {loading ? "Analyzing..." : "Re-Analyze Map"}
        </button>
      </div>

      {/* Main Score & Risk Badge Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px", background: "#111827", padding: "16px", borderRadius: "10px", marginBottom: "16px" }}>
        {/* ML Score Circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRight: "1px solid #1f2937", paddingRight: "12px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: `3px solid ${color}`,
              boxShadow: `0 0 16px ${color}44`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#1f2937"
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff", lineHeight: 1 }}>
              {loading ? "—" : mlData?.score}
            </span>
            <span style={{ fontSize: "10px", color: "#9ca3af" }}>ML Index</span>
          </div>
          <span
            style={{
              marginTop: "8px",
              fontSize: "12px",
              fontWeight: "600",
              color: color,
              background: `${color}22`,
              padding: "2px 10px",
              borderRadius: "12px",
              border: `1px solid ${color}44`
            }}
          >
            {loading ? "Loading..." : mlData?.label}
          </span>
        </div>

        {/* Predictive Risk Metrics */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
              <span style={{ color: "#9ca3af" }}>Incident Risk Prob.</span>
              <span style={{ fontWeight: "bold", color: mlData?.incidentProbability > 50 ? "#FF5252" : "#00E676" }}>
                {loading ? "—" : `${mlData?.incidentProbability}%`}
              </span>
            </div>
            <div style={{ width: "100%", background: "#374151", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${mlData?.incidentProbability || 0}%`,
                  background: mlData?.incidentProbability > 50 ? "#FF5252" : "#00E676",
                  height: "100%",
                  transition: "width 0.5s ease"
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "#d1d5db" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b" }}>
              <FaClock style={{ fontSize: "12px" }} />
              <strong>Safe Window:</strong>
            </div>
            <span style={{ color: "#9ca3af", fontSize: "11px" }}>{mlData?.optimalWindow}</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div style={{ background: "#111827", padding: "12px 14px", borderRadius: "8px", marginBottom: "16px", borderLeft: `3px solid ${color}` }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#e5e7eb", lineHeight: "1.4" }}>
          💡 <strong>ML Advisory for Location ({locationText}):</strong> {loading ? "Computing optimal safety path..." : mlData?.recommendation}
        </p>
      </div>

      {/* ML Feature Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontSize: "11px", textAlign: "center" }}>
        <div style={{ background: "#111827", padding: "8px", borderRadius: "6px" }}>
          <div style={{ color: "#9ca3af" }}>Incidents</div>
          <div style={{ fontWeight: "bold", color: (mlData?.featureBreakdown?.incidentCount || 0) > 1 ? "#f87171" : "#34d399" }}>
            {mlData?.featureBreakdown?.incidentCount ?? 0} Nearby
          </div>
        </div>
        <div style={{ background: "#111827", padding: "8px", borderRadius: "6px" }}>
          <div style={{ color: "#9ca3af" }}>Lighting Index</div>
          <div style={{ fontWeight: "bold", color: "#60a5fa" }}>{mlData?.featureBreakdown?.lightingScore || 75}%</div>
        </div>
        <div style={{ background: "#111827", padding: "8px", borderRadius: "6px" }}>
          <div style={{ color: "#9ca3af" }}>Safe Zones</div>
          <div style={{ fontWeight: "bold", color: "#34d399" }}>{mlData?.featureBreakdown?.safeZoneCount || 3} Nearby</div>
        </div>
        <div style={{ background: "#111827", padding: "8px", borderRadius: "6px" }}>
          <div style={{ color: "#9ca3af" }}>Time Risk</div>
          <div style={{ fontWeight: "bold", color: mlData?.isNight ? "#f87171" : "#34d399" }}>
            {mlData?.featureBreakdown?.timeOfDayRisk || "Low"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MLSafetyCard;
