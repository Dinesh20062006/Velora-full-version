import { useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import {
  getAllPoliceIncidents,
  updateCaseStatus,
  getRegisteredPoliceOfficers,
  assignPoliceOfficerToCase
} from "../../../api/policeApi";

function PendingCases() {
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
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!cancelled) {
        await fetchCases();
        await fetchOfficers();
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCaseStatus(id, newStatus);
      setCases((prev) =>
        prev.map((c) => {
          const cId = c.complaintId || c.id;
          return cId === id ? { ...c, status: newStatus } : c;
        })
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    }
  };

  const handleAssignOfficer = async (caseId, officerId) => {
    const selectedOfficer = officers.find(
      (o) => String(o.id || o.policeId) === String(officerId)
    );
    const officerName = selectedOfficer ? selectedOfficer.name : "";
    try {
      await assignPoliceOfficerToCase(caseId, officerId, officerName);
      setCases((prev) =>
        prev.map((c) => {
          const cId = c.complaintId || c.id;
          return cId === caseId
            ? { ...c, assignedOfficerId: officerId, assignedOfficerName: officerName, assignedOfficer: officerId }
            : c;
        })
      );
    } catch (err) {
      console.error("Failed to assign police officer:", err);
      alert("Failed to assign police officer");
    }
  };

  return (
    <UserLayout>
      <div className="casePage">
        <div className="top">
          <div>
            <h1>Incident Management</h1>
            <p>Live Incident Management Queue & Officer Dispatch Command</p>
          </div>
        </div>

        <div className="tableBox">
          <h2>Incident Queue (Live Database Feed)</h2>
          {loading ? (
            <p>Loading incident management queue...</p>
          ) : cases.length === 0 ? (
            <p>No incidents recorded in queue.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Victim / Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Evidence Photo</th>
                  <th>Status</th>
                  <th>Assign Police Officer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item, index) => {
                  const cId = item.complaintId || item.id || index + 1;
                  const loc = typeof item.location === "object" ? item.location?.address : (item.location || item.address || "Location recorded");
                  const currentStatus = (item.status || "PENDING").toUpperCase();
                  const currentOfficer = item.assignedOfficerId || item.assignedOfficer || item.officerId || "";

                  return (
                    <tr key={cId}>
                      <td><strong>INC-{cId}</strong></td>
                      <td>{item.userName || item.title || item.victimName || "Citizen User"}</td>
                      <td><span style={{ background: "#374151", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>{item.category || item.type || "HARASSMENT"}</span></td>
                      <td>📍 {loc}</td>
                      <td>
                        {item.imageUrl ? (
                          <a href={item.imageUrl} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontWeight: "600", textDecoration: "underline" }}>
                            📷 View Photo
                          </a>
                        ) : (
                          <span style={{ color: "#6b7280", fontSize: "12px" }}>No Photo</span>
                        )}
                      </td>
                      <td>
                        <span className={currentStatus === "RESOLVED" ? "low" : "high"}>
                          {currentStatus}
                        </span>
                      </td>
                      <td>
                        <select
                          value={currentOfficer}
                          onChange={(e) => handleAssignOfficer(cId, e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: "4px", background: "#1f2937", color: "#60a5fa", border: "1px solid #3b82f6", cursor: "pointer", fontWeight: "600" }}
                        >
                          <option value="">-- Select Officer --</option>
                          {officers.map((off) => (
                            <option key={off.id || off.policeId} value={off.id || off.policeId}>
                              🆔 {off.policeId || off.id} ({off.name})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleStatusChange(cId, e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: "4px", background: "#2d3748", color: "#fff", border: "1px solid #4b5563", cursor: "pointer" }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </UserLayout>
  );
}

export default PendingCases;