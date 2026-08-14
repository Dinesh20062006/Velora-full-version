import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getSystemHealth } from "../../api/adminApi";
import { IoPulseOutline, IoAlertCircleOutline, IoRefreshOutline } from "react-icons/io5";

const SERVICE_LIST = [
  { key: "gateway", name: "API GATEWAY", port: 8080 },
  { key: "authService", name: "AUTH SERVICE", port: 8081 },
  { key: "userService", name: "USER SERVICE", port: 8082 },
  { key: "safetyService", name: "SAFETY SERVICE", port: 8083 },
  { key: "aiService", name: "AI / ML SERVICE", port: 8000 },
  { key: "notificationService", name: "NOTIFICATION SERVICE", port: 8085 },
  { key: "policeService", name: "POLICE SERVICE", port: 8086 },
  { key: "adminService", name: "ADMIN SERVICE", port: 8087 }
];

function SystemHealth() {
  const [healthMap, setHealthMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await getSystemHealth();
      if (res?.data) {
        setHealthMap(res.data);
      }
    } catch (err) {
      console.error("Error fetching system health:", err);
    } finally {
      setLastCheck(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!cancelled) {
        await fetchHealth();
      }
    }

    loadData();

    // Auto-refresh every 3s to reflect microservice start/stop instantly
    const interval = setInterval(() => {
      if (!cancelled) {
        fetchHealth();
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="casePage" style={{ paddingBottom: "40px" }}>
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: "#f9fafb", margin: 0 }}>Microservices Infrastructure Health</h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0" }}>
              Live real-time health monitoring of Velora microservices. Auto-polls every 3s via backend Admin Gateway.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
            <button
              type="button"
              onClick={fetchHealth}
              disabled={loading}
              style={{
                background: "#1f2937",
                color: "#60a5fa",
                border: "1px solid #374151",
                padding: "8px 14px",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <IoRefreshOutline style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Probe Now
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
          {SERVICE_LIST.map((svc) => {
            const raw = healthMap[svc.key];
            const statusStr = typeof raw === "object" ? (raw?.status || "DOWN") : String(raw || "DOWN");
            const latencyStr = typeof raw === "object" ? (raw?.latency || "Offline / Unreachable") : (statusStr === "UP" ? "< 5ms latency" : "Offline / Unreachable");
            const isUp = statusStr === "UP";

            return (
              <div
                key={svc.key}
                style={{
                  background: "#1f2937",
                  padding: "20px",
                  borderRadius: "12px",
                  border: `1px solid ${isUp ? "#374151" : "#ef4444"}`,
                  boxShadow: isUp ? "none" : "0 0 14px rgba(239, 68, 68, 0.3)",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ color: "#f3f4f6", fontSize: "16px", margin: 0 }}>{svc.name}</h3>
                  {isUp ? (
                    <IoPulseOutline style={{ color: "#00E676", fontSize: "24px" }} />
                  ) : (
                    <IoAlertCircleOutline style={{ color: "#ef4444", fontSize: "24px" }} />
                  )}
                </div>
                <p style={{ margin: "12px 0 0 0", color: "#9ca3af", fontSize: "14px" }}>
                  Status:{" "}
                  <strong style={{ color: isUp ? "#00E676" : "#ef4444", fontSize: "15px" }}>
                    ● {isUp ? "UP" : "DOWN"}
                  </strong>
                </p>
                <p style={{ margin: "4px 0 0 0", color: isUp ? "#9ca3af" : "#f87171", fontSize: "12px" }}>
                  Port: <code style={{ color: "#60a5fa" }}>{svc.port}</code> | Ping: {latencyStr}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

export default SystemHealth;
