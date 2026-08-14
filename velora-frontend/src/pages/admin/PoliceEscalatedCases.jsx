import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  getEscalatedPoliceCases,
  updateEscalatedCaseStatus,
  deleteEscalatedCase
} from "../../api/adminApi";
import {
  IoSearchOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoImageOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoDocumentTextOutline,
  IoCheckmarkCircleOutline
} from "react-icons/io5";

function PoliceEscalatedCases() {
  const [cases, setCases] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewImage, setPreviewImage] = useState(null);

  const loadEscalatedCases = () => {
    const data = getEscalatedPoliceCases();
    setCases(data || []);
  };

  useEffect(() => {
    loadEscalatedCases();
    const interval = setInterval(loadEscalatedCases, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateEscalatedCaseStatus(id, newStatus);
      setCases((prev) =>
        prev.map((c) => (String(c.id || c.complaintId) === String(id) ? { ...c, adminStatus: newStatus } : c))
      );
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this escalated incident case from the Admin portal?")) {
      try {
        await deleteEscalatedCase(id);
        setCases((prev) => prev.filter((c) => String(c.id || c.complaintId) !== String(id)));
      } catch (e) {
        console.error("Failed to delete case", e);
      }
    }
  };

  // Filter cases based on search and status filter
  const filteredCases = cases.filter((item) => {
    const status = item.adminStatus || "PENDING_ADMIN_REVIEW";
    if (statusFilter !== "ALL" && status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cId = String(item.complaintId || item.id || "");
      const name = String(item.userName || item.title || item.victimName || "").toLowerCase();
      const loc = String(item.location || "").toLowerCase();
      return cId.includes(q) || name.includes(q) || loc.includes(q);
    }
    return true;
  });

  const totalCount = cases.length;
  const pendingCount = cases.filter((c) => (c.adminStatus || "PENDING_ADMIN_REVIEW") === "PENDING_ADMIN_REVIEW").length;
  const underReviewCount = cases.filter((c) => c.adminStatus === "UNDER_REVIEW").length;
  const resolvedCount = cases.filter((c) => c.adminStatus === "RESOLVED" || c.adminStatus === "ACTION_TAKEN").length;

  return (
    <AdminLayout>
      <div style={{ color: "#f8fafc" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#ffffff", margin: "0 0 8px 0" }}>
            Police Escalated Incident Cases
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            High-level incident files forwarded by Police Officers for administrative review, oversight, and statutory action.
          </p>
        </div>

        {/* Summary Metrics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Total Escalated</span>
            <h2 style={{ fontSize: "28px", color: "#60a5fa", margin: "8px 0 0 0", fontWeight: "700" }}>{totalCount}</h2>
          </div>

          <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Pending Admin Review</span>
            <h2 style={{ fontSize: "28px", color: "#f87171", margin: "8px 0 0 0", fontWeight: "700" }}>{pendingCount}</h2>
          </div>

          <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Under Review</span>
            <h2 style={{ fontSize: "28px", color: "#fbbf24", margin: "8px 0 0 0", fontWeight: "700" }}>{underReviewCount}</h2>
          </div>

          <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "18px" }}>
            <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Action Taken / Resolved</span>
            <h2 style={{ fontSize: "28px", color: "#34d399", margin: "8px 0 0 0", fontWeight: "700" }}>{resolvedCount}</h2>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", background: "#131c31", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <IoSearchOutline style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "18px" }} />
            <input
              type="text"
              placeholder="Search by Case ID, reporter name, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", background: "#0b0f19", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 14px 10px 42px", color: "#f8fafc", fontSize: "14px", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: "600" }}>Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 14px", color: "#f8fafc", fontSize: "13px", outline: "none", cursor: "pointer" }}
            >
              <option value="ALL">All Escalated Cases</option>
              <option value="PENDING_ADMIN_REVIEW">Pending Admin Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Cases Grid */}
        {filteredCases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#131c31", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>
            <IoShieldCheckmarkOutline style={{ fontSize: "48px", color: "#475569", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "18px", color: "#f8fafc", margin: "0 0 6px 0" }}>No Escalated Cases Found</h3>
            <p style={{ fontSize: "14px", margin: 0 }}>There are currently no cases forwarded by police matching your search.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "20px" }}>
            {filteredCases.map((item) => {
              const cId = item.complaintId || item.id;
              const displayStatus = item.adminStatus || "PENDING_ADMIN_REVIEW";
              
              let statusBg = "rgba(239, 68, 68, 0.15)";
              let statusColor = "#ef4444";
              let statusBorder = "#dc2626";

              if (displayStatus === "UNDER_REVIEW") {
                statusBg = "rgba(245, 158, 11, 0.15)";
                statusColor = "#f59e0b";
                statusBorder = "#d97706";
              } else if (displayStatus === "ACTION_TAKEN" || displayStatus === "RESOLVED") {
                statusBg = "rgba(16, 185, 129, 0.15)";
                statusColor = "#10b981";
                statusBorder = "#059669";
              }

              return (
                <div
                  key={cId}
                  style={{
                    background: "#131c31",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
                  }}
                >
                  <div>
                    {/* Top Header Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span style={{ background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "12px", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                        INC-{cId}
                      </span>
                      <span style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" }}>
                        {displayStatus.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Reporter Name & Incident Category */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
                        <IoPersonOutline style={{ color: "#3b82f6" }} />
                        {item.userName || item.title || item.victimName || "Citizen User"}
                      </div>
                      <span style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" }}>
                        {item.category || item.type || "General Incident"}
                      </span>
                    </div>

                    {/* Detailed Location with Latitude & Longitude */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#e2e8f0", fontSize: "13px", marginBottom: "14px", background: "#0b0f19", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <IoLocationOutline style={{ color: "#ef4444", fontSize: "16px", flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ lineHeight: "1.4" }}>{item.location}</span>
                    </div>

                    {/* Incident Description */}
                    {item.description && (
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "4px" }}>DESCRIPTION</span>
                        <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0, lineHeight: "1.4" }}>{item.description}</p>
                      </div>
                    )}

                    {/* Escalation Meta (Police Officer & Time) */}
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div>👮 Escalated By: <strong style={{ color: "#f8fafc" }}>{item.escalatedByOfficer || "Police Officer"}</strong></div>
                      <div><IoTimeOutline style={{ verticalAlign: "middle", marginRight: "4px" }} /> Escalated On: {new Date(item.escalatedAt || Date.now()).toLocaleString()}</div>
                    </div>

                    {/* Evidence Photo Preview */}
                    <div style={{ marginBottom: "16px" }}>
                      {item.imageUrl ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(59, 130, 246, 0.1)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>
                            <IoImageOutline style={{ fontSize: "18px" }} /> Evidence Photo Attached
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewImage({
                              url: item.imageUrl,
                              caseId: cId,
                              title: item.userName || item.title || "Incident Report",
                              location: item.location
                            })}
                            style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                          >
                            View Photo
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0b0f19", padding: "8px 12px", borderRadius: "8px", color: "#64748b", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                          <IoImageOutline style={{ fontSize: "16px" }} /> No Evidence Photo Attached
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Controls */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px", display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "4px", fontWeight: "600" }}>ADMIN STATUS</label>
                      <select
                        value={displayStatus}
                        onChange={(e) => handleStatusChange(cId, e.target.value)}
                        style={{ width: "100%", background: "#0b0f19", color: statusColor, border: `1px solid ${statusBorder}`, padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", outline: "none", cursor: "pointer" }}
                      >
                        <option value="PENDING_ADMIN_REVIEW">PENDING ADMIN REVIEW</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="ACTION_TAKEN">ACTION TAKEN</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(cId)}
                      title="Delete / Archive Case"
                      style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "10px 14px", borderRadius: "8px", marginTop: "16px", cursor: "pointer", fontSize: "16px" }}
                    >
                      <IoTrashOutline />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Viewer */}
        {previewImage && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setPreviewImage(null)}>
            <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "24px", maxWidth: "650px", width: "90%", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: "#ffffff", margin: "0 0 8px 0" }}>Evidence Photo — INC-{previewImage.caseId}</h3>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px 0" }}>📍 {previewImage.location}</p>
              <div style={{ background: "#0b0f19", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "center", minHeight: "220px" }}>
                <img src={previewImage.url} alt="Evidence" style={{ maxWidth: "100%", maxHeight: "50vh", objectFit: "contain" }} />
              </div>
              <button type="button" onClick={() => setPreviewImage(null)} style={{ marginTop: "16px", alignSelf: "flex-end", background: "#3b82f6", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PoliceEscalatedCases;
