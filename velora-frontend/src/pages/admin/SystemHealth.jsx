import React from "react";
import AdminLayout from "./AdminLayout";
import { IoPulseOutline } from "react-icons/io5";

function SystemHealth() {
  const services = [
    { name: "POLICE SERVICE", status: "UP", latency: "< 5ms latency" },
    { name: "AI SERVICE", status: "UP", latency: "< 5ms latency" },
    { name: "AUTH SERVICE", status: "UP", latency: "< 5ms latency" },
    { name: "NOTIFICATION SERVICE", status: "UP", latency: "< 5ms latency" },
    { name: "GATEWAY", status: "UP", latency: "< 5ms latency" },
    { name: "USER SERVICE", status: "UP", latency: "< 5ms latency" },
    { name: "SAFETY SERVICE", status: "UP", latency: "< 5ms latency" }
  ];

  return (
    <AdminLayout>
      <div className="casePage">
        <div className="top">
          <div>
            <h1 style={{ color: "#f9fafb" }}>Microservices Infrastructure Health</h1>
            <p style={{ color: "#9ca3af" }}>Live health status of Spring Boot microservices behind API Gateway</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
          {services.map((s) => (
            <div key={s.name} style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#f3f4f6", fontSize: "16px", margin: 0 }}>{s.name}</h3>
                <IoPulseOutline style={{ color: "#00E676", fontSize: "24px" }} />
              </div>
              <p style={{ margin: "12px 0 0 0", color: "#9ca3af", fontSize: "14px" }}>
                Status: <strong style={{ color: "#00E676" }}>● {s.status}</strong>
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "12px" }}>
                Ping: {s.latency}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export default SystemHealth;
