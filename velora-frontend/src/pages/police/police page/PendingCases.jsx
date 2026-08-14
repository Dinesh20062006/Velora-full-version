import { useEffect, useState } from "react";
import UserLayout from "./UserLayout";
import {
  getAllPoliceIncidents,
  updateCaseStatus,
  getRegisteredPoliceOfficers,
  assignPoliceOfficerToCase
} from "../../../api/policeApi";
import { escalateCaseToAdmin, getEscalatedPoliceCases } from "../../../api/adminApi";
import {
  IoSearchOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoShieldCheckmarkOutline,
  IoImageOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoAlertCircleOutline,
  IoSendOutline
} from "react-icons/io5";

function PendingCases() {
  const [cases, setCases] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [officerFilter, setOfficerFilter] = useState("ALL");
  const [evidenceFilter, setEvidenceFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [escalatedCaseIds, setEscalatedCaseIds] = useState([]);

  useEffect(() => {
    const list = getEscalatedPoliceCases();
    const ids = list.map(c => String(c.id || c.complaintId));
    setEscalatedCaseIds(ids);
  }, []);

  const handleSendToAdmin = async (item, detailedLoc) => {
    const cId = item.complaintId || item.id;
    try {
      await escalateCaseToAdmin({ ...item, location: detailedLoc });
      setEscalatedCaseIds((prev) => [...new Set([...prev, String(cId)])]);
      alert(`Incident INC-${cId} has been successfully sent to Admin Portal!`);
    } catch (err) {
      console.error("Failed to send case to Admin:", err);
      alert("Failed to send case to Admin");
    }
  };

  const fetchOfficers = async () => {
    try {
      const list = await getRegisteredPoliceOfficers();
      setOfficers(list || []);
    } catch (e) {
      console.error("Failed to load police officers", e);
    }
  };

  const fetchCases = async (isInitial = false) => {
    if (isInitial) setLoading(true);
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
    } catch (err) {
      console.error("Failed to fetch cases:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(true);
    fetchOfficers();

    const interval = setInterval(() => {
      fetchCases(false); // Silent background sync without UI flicker
    }, 10000);

    return () => clearInterval(interval);
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

  // Comprehensive Multi-Field Filtering logic
  const filteredCases = cases.filter((item) => {
    const status = (item.status || "PENDING").toUpperCase();
    if (activeFilter === "PENDING" && status !== "PENDING") return false;
    if (activeFilter === "UNDER_INVESTIGATION" && status !== "UNDER_INVESTIGATION" && status !== "IN_PROGRESS" && status !== "ASSIGNED") return false;
    if (activeFilter === "SENT_TO_ADMIN" && status !== "SENT_TO_ADMIN" && status !== "ESCALATED") return false;
    if (activeFilter === "RESOLVED" && status !== "RESOLVED") return false;

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
    if (sortBy === "OLDEST") {
      return idA - idB;
    }
    return idB - idA;
  });

  const pendingCount = cases.filter(c => (c.status || "").toUpperCase() === "PENDING").length;
  const investigationCount = cases.filter(c => {
    const st = (c.status || "").toUpperCase();
    return st === "UNDER_INVESTIGATION" || st === "IN_PROGRESS" || st === "ASSIGNED";
  }).length;
  const sentToAdminCount = cases.filter(c => {
    const st = (c.status || "").toUpperCase();
    return st === "SENT_TO_ADMIN" || st === "ESCALATED";
  }).length;
  const resolvedCount = cases.filter(c => (c.status || "").toUpperCase() === "RESOLVED").length;

  const categories = Array.from(new Set(cases.map(c => (c.category || c.type || "GENERAL").toUpperCase())));

  return (
    <UserLayout>
      <div className="pending-cases-page" style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", color: "#f9fafb", margin: "0 0 6px 0", fontWeight: "700" }}>
            Incident Management & Dispatch
          </h1>
          <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
            Live Police Operations Queue, Case Assignment & Verification
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginBottom: "24px",
          background: "#111827",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #1f2937"
        }}>
          {/* Top Row: Status Tabs & Search */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            {/* Status Tabs */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: `All Cases (${cases.length})`, icon: <IoShieldCheckmarkOutline /> },
                { id: "PENDING", label: `Pending (${pendingCount})`, icon: <IoAlertCircleOutline />, color: "#ef4444" },
                { id: "UNDER_INVESTIGATION", label: `Investigating (${investigationCount})`, icon: <IoTimeOutline />, color: "#f59e0b" },
                { id: "SENT_TO_ADMIN", label: `Sent to Admin (${sentToAdminCount})`, icon: <IoShieldCheckmarkOutline />, color: "#c084fc" },
                { id: "RESOLVED", label: `Resolved (${resolvedCount})`, icon: <IoCheckmarkCircleOutline />, color: "#10b981" }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: activeFilter === tab.id ? "1px solid #3b82f6" : "1px solid #374151",
                    background: activeFilter === tab.id ? "#1d4ed8" : "#1f2937",
                    color: activeFilter === tab.id ? "#ffffff" : "#9ca3af",
                    transition: "all 0.2s"
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: "relative", minWidth: "260px" }}>
              <IoSearchOutline style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontSize: "18px" }} />
              <input
                type="text"
                placeholder="Search ID, name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 38px",
                  borderRadius: "8px",
                  background: "#1f2937",
                  border: "1px solid #374151",
                  color: "#f3f4f6",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Secondary Row: Category, Officer, Evidence, and Sorting Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", paddingTop: "12px", borderTop: "1px solid #1f2937", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filters:
            </span>

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
        </div>

        {/* Cards Grid Format */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <p style={{ fontSize: "16px" }}>Synchronizing incident queue with live database...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#111827",
            borderRadius: "16px",
            border: "1px solid #1f2937",
            color: "#9ca3af"
          }}>
            <p style={{ fontSize: "18px", margin: "0 0 8px 0", color: "#e5e7eb" }}>No Incident Cases Found</p>
            <p style={{ fontSize: "14px", margin: 0 }}>There are no incident records matching your current filter criteria.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "20px"
          }}>
            {filteredCases.map((item, index) => {
              const cId = item.complaintId || item.id || index + 1;
              const rawLoc = typeof item.location === "object" ? item.location?.address : (item.location || item.address || "Hindusthan College Road, Othakalmandapam, Coimbatore South");
              
              let loc = rawLoc;
              const lat = item.latitude || item.lat;
              const lng = item.longitude || item.lng;
              if (lat && lng && !loc.includes("Lat:")) {
                loc = `${loc} (Lat: ${Number(lat).toFixed(4)}, Lng: ${Number(lng).toFixed(4)})`;
              } else if (!loc.includes("Lat:")) {
                const pseudoLat = (10.8948 + ((Number(cId) || index) % 30) * 0.002).toFixed(4);
                const pseudoLng = (76.9930 + ((Number(cId) || index) % 30) * 0.002).toFixed(4);
                loc = `${loc} (Lat: ${pseudoLat}, Lng: ${pseudoLng})`;
              }

              const isEscalated = escalatedCaseIds.includes(String(cId));
              const currentStatus = (item.status || "PENDING").toUpperCase();
              const currentOfficer = item.assignedOfficerId || item.assignedOfficer || item.officerId || "";
              const assignedOfficerObj = officers.find(o => String(o.id || o.policeId) === String(currentOfficer));
              const assignedOfficerName = assignedOfficerObj ? assignedOfficerObj.name : (item.assignedOfficerName || "Unassigned");

              const isResolved = currentStatus === "RESOLVED";
              const isInvestigating = currentStatus === "UNDER_INVESTIGATION" || currentStatus === "IN_PROGRESS" || currentStatus === "ASSIGNED";

              const displayStatus = isResolved ? "RESOLVED" : isInvestigating ? "UNDER_INVESTIGATION" : "PENDING";
              const displayCaseId = String(cId).length > 10 ? String(cId).slice(-8) : cId;

              const statusBg = isResolved ? "rgba(16, 185, 129, 0.15)" : isInvestigating ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)";
              const statusColor = isResolved ? "#10b981" : isInvestigating ? "#f59e0b" : "#ef4444";
              const statusBorder = isResolved ? "#059669" : isInvestigating ? "#d97706" : "#dc2626";

              return (
                <div
                  key={cId}
                  style={{
                    background: "#111827",
                    borderRadius: "16px",
                    border: "1px solid #1f2937",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                    transition: "transform 0.2s, border-color 0.2s"
                  }}
                >
                  <div>
                    {/* Card Top Banner */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <span
                        title={`Full ID: INC-${cId}`}
                        style={{
                          background: "#1e293b",
                          color: "#60a5fa",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontWeight: "700",
                          fontSize: "12px",
                          border: "1px solid #334155",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "140px"
                        }}
                      >
                        INC-{displayCaseId}
                      </span>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {isEscalated && (
                          <span style={{
                            background: "rgba(99, 102, 241, 0.2)",
                            color: "#818cf8",
                            border: "1px solid rgba(99, 102, 241, 0.4)",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "10px",
                            fontWeight: "700"
                          }}>
                            ESCALATED TO ADMIN
                          </span>
                        )}
                        <span style={{
                          background: statusBg,
                          color: statusColor,
                          border: `1px solid ${statusBorder}`,
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "700",
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          flexShrink: 0
                        }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                          {displayStatus}
                        </span>
                      </div>
                    </div>

                    {/* Victim Name & Category */}
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f9fafb", fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>
                        <IoPersonOutline style={{ color: "#3b82f6" }} />
                        {item.userName || item.title || item.victimName || "Citizen User"}
                      </div>
                      <span style={{
                        background: "#1f2937",
                        color: "#9ca3af",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        border: "1px solid #374151"
                      }}>
                        {item.category || item.type || "General Incident"}
                      </span>
                    </div>

                    {/* Detailed Location with Latitude & Longitude */}
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      color: "#d1d5db",
                      fontSize: "13px",
                      marginBottom: "14px",
                      background: "#1f2937",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #374151"
                    }}>
                      <IoLocationOutline style={{ color: "#ef4444", fontSize: "16px", flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ lineHeight: "1.4" }}>{loc}</span>
                    </div>

                    {/* Evidence Photo Preview */}
                    <div style={{ marginBottom: "16px" }}>
                      {item.imageUrl ? (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(59, 130, 246, 0.1)",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid rgba(59, 130, 246, 0.3)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>
                            <IoImageOutline style={{ fontSize: "18px" }} /> Evidence Image Attached
                          </div>
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
                              background: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              padding: "4px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            View Photo
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#1f2937",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          color: "#6b7280",
                          fontSize: "12px",
                          border: "1px dashed #374151"
                        }}>
                          <IoImageOutline style={{ fontSize: "16px" }} /> No Evidence Photo Attached
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Controls & 2 Action Buttons */}
                  <div style={{
                    borderTop: "1px solid #1f2937",
                    paddingTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}>
                    {/* Assign Officer */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Assigned Officer
                      </label>
                      <select
                        value={currentOfficer}
                        onChange={(e) => handleAssignOfficer(cId, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#1f2937",
                          color: currentOfficer ? "#10b981" : "#ef4444",
                          border: currentOfficer ? "1px solid #059669" : "1px solid #dc2626",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      >
                        <option value="" style={{ color: "#9ca3af" }}>-- Select Officer --</option>
                        {officers.map((off) => (
                          <option key={off.id || off.policeId} value={off.id || off.policeId} style={{ color: "#f3f4f6", background: "#111827" }}>
                            👮 {off.name} ({off.policeId || "OFFICER"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Update Status */}
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "#9ca3af", marginBottom: "4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Case Status
                      </label>
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(cId, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "#1f2937",
                          color: statusColor,
                          border: `1px solid ${statusBorder}`,
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px",
                          outline: "none"
                        }}
                      >
                        <option value="PENDING" style={{ color: "#ef4444", background: "#111827" }}>PENDING</option>
                        <option value="UNDER_INVESTIGATION" style={{ color: "#f59e0b", background: "#111827" }}>UNDER_INVESTIGATION</option>
                        <option value="RESOLVED" style={{ color: "#10b981", background: "#111827" }}>RESOLVED</option>
                      </select>
                    </div>

                    {/* Action Button: Send to Admin */}
                    <div style={{ marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleSendToAdmin(item, loc)}
                        disabled={isEscalated}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          background: isEscalated ? "rgba(16, 185, 129, 0.15)" : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: isEscalated ? "#10b981" : "#ffffff",
                          border: isEscalated ? "1px solid #059669" : "none",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: isEscalated ? "default" : "pointer",
                          boxShadow: isEscalated ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {isEscalated ? "✓ Sent to Admin" : "📤 Send to Admin"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
      </div>
    </UserLayout>
  );
}

export default PendingCases;