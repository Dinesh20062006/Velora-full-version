import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAuditLogs } from "../../api/adminApi";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then((res) => setLogs(res?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="casePage">
        <div className="top">
          <div>
            <h1 style={{ color: "#f9fafb" }}>Platform Audit Trail Logs</h1>
            <p style={{ color: "#9ca3af" }}>Trace administrative and security events performed across services</p>
          </div>
        </div>

        <div className="tableBox" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
          <h2 style={{ color: "#f3f4f6" }}>System Action History</h2>
          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading audit logs...</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", color: "#d1d5db" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #374151" }}>
                  <th style={{ padding: "12px" }}>Log ID</th>
                  <th style={{ padding: "12px" }}>Actor</th>
                  <th style={{ padding: "12px" }}>Action</th>
                  <th style={{ padding: "12px" }}>Target Resource</th>
                  <th style={{ padding: "12px" }}>IP Address</th>
                  <th style={{ padding: "12px" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #27272a" }}>
                    <td style={{ padding: "12px" }}>{log.id}</td>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>{log.actorName}<br /><small style={{ color: "#ec4899" }}>{log.actorRole}</small></td>
                    <td style={{ padding: "12px", color: "#60a5fa", fontWeight: "bold" }}>{log.action}</td>
                    <td style={{ padding: "12px" }}>{log.targetResource}</td>
                    <td style={{ padding: "12px" }}>{log.ipAddress}</td>
                    <td style={{ padding: "12px", color: "#9ca3af" }}>{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AuditLogs;
