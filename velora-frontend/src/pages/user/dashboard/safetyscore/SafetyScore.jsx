import React from "react";
import { FaShieldAlt, FaMapMarkerAlt } from "react-icons/fa";

function SafetyScore({ score, label, color, loading, locationName }) {
  const displayScore = loading ? "—" : (score ?? 85);
  const displayLabel = loading ? "Analyzing Location..." : (label || "Safe Zone");
  const ringColor = color || "#00E676";

  return (
    <div className="safety-score" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <FaShieldAlt style={{ color: ringColor, fontSize: "22px" }} />
        <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#f3f4f6", margin: 0 }}>Safety Score of Your Location</h2>
      </div>

      <div
        className="score-circle"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: `4px solid ${ringColor}`,
          boxShadow: `0 0 20px ${ringColor}44`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          margin: "12px 0",
          background: "rgba(17, 24, 39, 0.6)"
        }}
      >
        <span style={{ fontSize: "36px", fontWeight: "bold", color: "#ffffff", lineHeight: 1 }}>
          {displayScore}
        </span>
        <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>out of 100</span>
      </div>

      <div style={{ margin: "8px 0" }}>
        <span
          style={{
            background: `${ringColor}22`,
            color: ringColor,
            border: `1px solid ${ringColor}66`,
            padding: "4px 14px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "600",
            letterSpacing: "0.5px",
            display: "inline-block"
          }}
        >
          {displayLabel}
        </span>
      </div>

      <p style={{ fontSize: "12px", color: "#9ca3af", margin: "8px 0 0 0", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
        <FaMapMarkerAlt style={{ color: "#ec4899" }} />
        {locationName || "Calculated from live GPS coordinates & nearby risk factors"}
      </p>
    </div>
  );
}

export default SafetyScore;

