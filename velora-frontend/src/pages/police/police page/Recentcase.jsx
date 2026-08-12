import { useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import {
  getAllPoliceIncidents,
  getRegisteredPoliceOfficers
} from "../../../api/policeApi";

function RecentCases() {
  const [cases, setCases] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOfficers = async () => {
    try {
      const list = await getRegisteredPoliceOfficers();
      setOfficers(list || []);
    } catch (e) {
      console.error("Failed to load police officers", e);
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await getAllPoliceIncidents();
      const data = res?.data || res?.content || res;
      if (Array.isArray(data)) {
        setCases(data);
      } else if (data?.content && Array.isArray(data.content)) {
        setCases(data.content);
      }
    } catch (e) {
      console.error("Failed to fetch cases", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchOfficers();

    const interval = setInterval(() => {
      fetchCases();
      fetchOfficers();
    }, 4000); // Live sync with database every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <UserLayout>
      <div className="casePage">
        <div className="top">
          <div>
            <h1>Recent Cases</h1>
            <p>AI Women's Safety Incident Records & Database Feed</p>
          </div>
        </div>

        <div className="caseCards">
          <div className="caseCard">
            <h3>Total Cases</h3>
            <h1>{cases.length}</h1>
            <p>Live Database Records</p>
          </div>

          <div className="caseCard redCard">
            <h3>Pending Attention</h3>
            <h1>{cases.filter((c) => (c.status || "").toUpperCase() === "PENDING").length}</h1>
            <p>Need Attention</p>
          </div>

          <div className="caseCard">
            <h3>Resolved</h3>
            <h1>{cases.filter((c) => (c.status || "").toUpperCase() === "RESOLVED").length}</h1>
            <p>Completed Cases</p>
          </div>

          <div className="caseCard">
            <h3>Active Investigation</h3>
            <h1>{cases.filter((c) => {
              const st = (c.status || "").toUpperCase();
              return st === "UNDER_INVESTIGATION" || st === "IN_PROGRESS" || st === "ASSIGNED";
            }).length}</h1>
            <p>Ongoing</p>
          </div>
        </div>

        <div className="tableBox" style={{ background: "#111827", padding: "24px", borderRadius: "12px", border: "1px solid #374151", marginTop: "24px" }}>
          <h2 style={{ color: "#f9fafb" }}>Case Records (Horizontal Feed)</h2>
          
          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading cases from database...</p>
          ) : cases.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No cases recorded yet.</p>
          ) : (
            <div style={{ overflowX: "auto", marginTop: "16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #374151", color: "#9ca3af" }}>
                    <th style={{ padding: "14px" }}>Case ID</th>
                    <th style={{ padding: "14px" }}>Victim / Title</th>
                    <th style={{ padding: "14px" }}>Category</th>
                    <th style={{ padding: "14px" }}>Location</th>
                    <th style={{ padding: "14px" }}>Evidence Photo</th>
                    <th style={{ padding: "14px" }}>Status</th>
                    <th style={{ padding: "14px" }}>Assigned Police Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((item, index) => {
                    const cId = item.complaintId || item.id || index + 1;
                    const loc = typeof item.location === "object" ? item.location?.address : (item.location || item.address || "Location recorded");
                    const currentStatus = (item.status || "PENDING").toUpperCase();
                    const currentOfficer = item.assignedOfficerId || item.assignedOfficer || item.officerId || "";
                    const assignedOfficerObj = officers.find(o => String(o.id || o.policeId) === String(currentOfficer));

                    return (
                      <tr key={cId} style={{ borderBottom: "1px solid #374151", color: "#e5e7eb" }}>
                        <td style={{ padding: "14px", fontWeight: "600", color: "#60a5fa" }}>INC-{cId}</td>
                        <td style={{ padding: "14px" }}>{item.userName || item.title || item.victimName || "Citizen User"}</td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ background: "#374151", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", color: "#f3f4f6" }}>
                            {item.category || item.type || "HARASSMENT"}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>📍 {loc}</td>
                        <td style={{ padding: "14px" }}>
                          {item.imageUrl ? (
                            <a href={item.imageUrl} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontWeight: "600", textDecoration: "underline" }}>
                              📷 View Photo
                            </a>
                          ) : (
                            <span style={{ color: "#6b7280", fontSize: "13px" }}>No Photo</span>
                          )}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            background: currentStatus === "RESOLVED" ? "rgba(16, 185, 129, 0.2)" : currentStatus === "UNDER_INVESTIGATION" ? "rgba(245, 158, 11, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: currentStatus === "RESOLVED" ? "#10b981" : currentStatus === "UNDER_INVESTIGATION" ? "#f59e0b" : "#ef4444"
                          }}>
                            {currentStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          {currentOfficer ? (
                            <span style={{ color: "#10b981", fontWeight: "600", whiteSpace: "nowrap" }}>
                              {assignedOfficerObj ? assignedOfficerObj.name : item.assignedOfficerName || "Assigned Officer"}
                            </span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: "600", whiteSpace: "nowrap" }}>
                              Not Assigned
                            </span>
                          )}
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

export default RecentCases;