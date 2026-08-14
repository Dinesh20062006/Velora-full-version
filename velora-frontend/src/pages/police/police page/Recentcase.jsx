import { useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import {
  getAllPoliceIncidents,
  getRegisteredPoliceOfficers
} from "../../../api/policeApi";
import {
  downloadIndividualEReport,
  downloadFullCaseHistoryReport
} from "../../../utils/reportExporter";
import { IoDownloadOutline, IoDocumentTextOutline } from "react-icons/io5";

function RecentCases() {
  const [cases, setCases] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [officerFilter, setOfficerFilter] = useState("ALL");
  const [evidenceFilter, setEvidenceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  const fetchOfficers = async () => {
    try {
      const list = await getRegisteredPoliceOfficers();
      setOfficers(list || []);
    } catch (e) {
      console.error("Failed to load police officers", e);
    }
  };

  const fetchCases = async (isInitial = false) => {
    if (isInitial || cases.length === 0) {
      setLoading(true);
    }
    try {
      const res = await getAllPoliceIncidents();
      const data = res?.data || res?.content || res;
      let rawList = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (data?.content && Array.isArray(data.content)) {
        rawList = data.content;
      }

      const sorted = [...rawList].sort((a, b) => {
        const idA = Number(a.complaintId || a.id || 0);
        const idB = Number(b.complaintId || b.id || 0);
        if (!isNaN(idA) && !isNaN(idB) && idA > 0 && idB > 0) {
          return idB - idA;
        }
        const dateA = new Date(a.createdAt || a.createdDate || a.timestamp || 0).getTime();
        const dateB = new Date(b.createdAt || b.createdDate || b.timestamp || 0).getTime();
        if (dateA && dateB) return dateB - dateA;
        return 0;
      });

      setCases(sorted);
    } catch (e) {
      console.error("Failed to fetch cases", e);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCases(true);
    fetchOfficers();

    const interval = setInterval(() => {
      fetchCases(false);
    }, 10000); // Silent background sync every 10 seconds without UI flicker

    return () => clearInterval(interval);
  }, []);

  const filteredCases = cases.filter((item) => {
    const status = (item.status || "PENDING").toUpperCase();
    if (statusFilter === "PENDING" && status !== "PENDING") return false;
    if (statusFilter === "UNDER_INVESTIGATION" && status !== "UNDER_INVESTIGATION" && status !== "IN_PROGRESS" && status !== "ASSIGNED") return false;
    if (statusFilter === "SENT_TO_ADMIN" && status !== "SENT_TO_ADMIN" && status !== "ESCALATED") return false;
    if (statusFilter === "RESOLVED" && status !== "RESOLVED") return false;

    const cat = (item.category || item.type || "GENERAL").toUpperCase();
    if (categoryFilter !== "ALL" && cat !== categoryFilter) return false;

    const currentOfficer = String(item.assignedOfficerId || item.assignedOfficer || item.officerId || "");
    if (officerFilter === "UNASSIGNED" && currentOfficer !== "") return false;
    if (officerFilter !== "ALL" && officerFilter !== "UNASSIGNED" && currentOfficer !== String(officerFilter)) return false;

    const hasPhoto = Boolean(item.imageUrl);
    if (evidenceFilter === "WITH_PHOTO" && !hasPhoto) return false;
    if (evidenceFilter === "WITHOUT_PHOTO" && hasPhoto) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cId = String(item.complaintId || item.id || "");
      const name = String(item.userName || item.title || item.victimName || "").toLowerCase();
      const loc = typeof item.location === "object" ? String(item.location?.address || "") : String(item.location || item.address || "");
      return cId.includes(q) || name.includes(q) || cat.toLowerCase().includes(q) || loc.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    const idA = Number(a.complaintId || a.id || 0);
    const idB = Number(b.complaintId || b.id || 0);
    if (sortBy === "OLDEST") return idA - idB;
    return idB - idA;
  });

  const categories = Array.from(new Set(cases.map(c => (c.category || c.type || "GENERAL").toUpperCase())));

  return (
    <UserLayout>
      <div className="casePage">
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>Recent Cases</h1>
            <p>AI Women's Safety Incident Records & Database Feed</p>
          </div>

          <button
            type="button"
            onClick={() => downloadFullCaseHistoryReport(cases, officers)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.4)",
              transition: "all 0.2s"
            }}
          >
            <IoDownloadOutline style={{ fontSize: "17px" }} /> Export Full Case History Report
          </button>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <h2 style={{ color: "#f9fafb", margin: 0 }}>Case Records Database ({filteredCases.length})</h2>
            
            {/* Search Box */}
            <input
              type="text"
              placeholder="🔍 Search Case ID, Name, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#1f2937",
                border: "1px solid #374151",
                color: "#f3f4f6",
                fontSize: "14px",
                outline: "none",
                minWidth: "260px"
              }}
            />
          </div>

          {/* Filter Bar Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "12px 0 16px 0", borderTop: "1px solid #1f2937", borderBottom: "1px solid #1f2937", marginBottom: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase" }}>Filters:</span>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">📌 All Statuses</option>
              <option value="PENDING">🔴 Pending</option>
              <option value="UNDER_INVESTIGATION">🟡 Investigating</option>
              <option value="SENT_TO_ADMIN">🟣 Sent to Admin</option>
              <option value="RESOLVED">🟢 Resolved</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">📁 All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Officer Filter */}
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">👮 All Officers</option>
              <option value="UNASSIGNED">⚠️ Unassigned Only</option>
              {officers.map(o => (
                <option key={o.id || o.policeId} value={o.id || o.policeId}>{o.name}</option>
              ))}
            </select>

            {/* Evidence Photo Filter */}
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">📷 All Evidence Types</option>
              <option value="WITH_PHOTO">🖼️ With Photo Only</option>
              <option value="WITHOUT_PHOTO">🚫 Without Photo</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#1f2937", border: "1px solid #374151", color: "#60a5fa", fontSize: "13px", cursor: "pointer", fontWeight: "600", marginLeft: "auto" }}
            >
              <option value="NEWEST">⚡ Newest Cases First</option>
              <option value="OLDEST">⏳ Oldest Cases First</option>
            </select>
          </div>
          
          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading cases from database...</p>
          ) : filteredCases.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No cases matching your filter criteria.</p>
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
                    <th style={{ padding: "14px" }}>Assigned Officer</th>
                    <th style={{ padding: "14px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((item, index) => {
                    const cId = item.complaintId || item.id || index + 1;
                    const loc = typeof item.location === "object" ? item.location?.address : (item.location || item.address || "Location recorded");
                    const currentStatus = (item.status || "PENDING").toUpperCase();
                    const currentOfficer = item.assignedOfficerId || item.assignedOfficer || item.officerId || "";
                    const assignedOfficerObj = officers.find(o => String(o.id || o.policeId) === String(currentOfficer));
                    const assignedOfficerName = assignedOfficerObj ? assignedOfficerObj.name : (item.assignedOfficerName || "Unassigned");

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
                            <button
                              type="button"
                              onClick={() => setPreviewImage({
                                url: item.imageUrl,
                                caseId: cId,
                                title: item.userName || item.title || item.victimName || "Citizen User",
                                category: item.category || item.type || "Incident Evidence",
                                location: loc
                              })}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#60a5fa",
                                fontWeight: "600",
                                textDecoration: "underline",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "14px"
                              }}
                            >
                              📷 View Photo
                            </button>
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
                            background: currentStatus === "RESOLVED" ? "rgba(16, 185, 129, 0.2)" : currentStatus === "UNDER_INVESTIGATION" ? "rgba(245, 158, 11, 0.2)" : currentStatus === "SENT_TO_ADMIN" || currentStatus === "ESCALATED" ? "rgba(168, 85, 247, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: currentStatus === "RESOLVED" ? "#10b981" : currentStatus === "UNDER_INVESTIGATION" ? "#f59e0b" : currentStatus === "SENT_TO_ADMIN" || currentStatus === "ESCALATED" ? "#c084fc" : "#ef4444"
                          }}>
                            {currentStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          {currentOfficer ? (
                            <span style={{ color: "#10b981", fontWeight: "600", whiteSpace: "nowrap" }}>
                              {assignedOfficerName}
                            </span>
                          ) : (
                            <span style={{ color: "#ef4444", fontWeight: "600", whiteSpace: "nowrap" }}>
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <button
                            type="button"
                            onClick={() => downloadIndividualEReport(item, assignedOfficerName)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#1f2937",
                              color: "#60a5fa",
                              border: "1px solid #3b82f6",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <IoDocumentTextOutline style={{ fontSize: "14px" }} /> E-Report
                          </button>
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

      {/* Dedicated In-App Evidence Photo Viewer Modal */}
      {previewImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(3, 7, 18, 0.85)",
            backdropFilter: "blur(10px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "700px",
              width: "90%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #1f2937", paddingBottom: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ color: "#f9fafb", margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    Evidence Photo — INC-{previewImage.caseId}
                  </h3>
                  <span style={{ background: "#374151", color: "#60a5fa", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                    {previewImage.category}
                  </span>
                </div>
                <p style={{ color: "#9ca3af", margin: "6px 0 0 0", fontSize: "13px" }}>
                  Reporter: <strong>{previewImage.title}</strong> | 📍 {previewImage.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: "#1f2937",
                  color: "#9ca3af",
                  border: "1px solid #374151",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                ✕
              </button>
            </div>

            {/* Image Container */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", background: "#030712", borderRadius: "12px", padding: "16px", overflow: "hidden", border: "1px solid #1f2937", minHeight: "250px" }}>
              <img
                src={previewImage.url}
                alt={`Evidence for INC-${previewImage.caseId}`}
                style={{ maxWidth: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>

            {/* Actions */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: "#3b82f6",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

export default RecentCases;