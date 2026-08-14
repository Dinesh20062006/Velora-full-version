import { useEffect, useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { 
  getAdminSafeZones, 
  addAdminMLZone, 
  getEscalatedPoliceCases, 
  updateEscalatedCaseStatus, 
  deleteEscalatedCase 
} from "../../api/adminApi";
import { classifyMLZone, fetchRealtimeMLMarkedZones } from "../../api/mlSafetyApi";
import { APIProvider, Map, AdvancedMarker, Pin, Circle } from "@vis.gl/react-google-maps";
import MapErrorBoundary from "../../common/MapErrorBoundary/MapErrorBoundary";
import { formatMLMarkedZonesForMap } from "../../utils/hotspotEngine";
import {
  IoLocationOutline,
  IoPersonOutline,
  IoImageOutline,
  IoTrashOutline,
  IoTimeOutline,
  IoSearchOutline,
  IoShieldCheckmarkOutline,
  IoMapOutline
} from "react-icons/io5";

function SafeZoneManagement() {
  const DEFAULT_LOCATION = { lat: 10.8795, lng: 77.0223 };
  const [safeZones, setSafeZones] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(DEFAULT_LOCATION.lat);
  const [longitude, setLongitude] = useState(DEFAULT_LOCATION.lng);
  const [zoneType, setZoneType] = useState("safe"); // 'safe' (green), 'moderate' (yellow), 'unsafe' (red)
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  // Police Escalated Cases State
  const [policeCases, setPoliceCases] = useState([]);
  const [policeSearchQuery, setPoliceSearchQuery] = useState("");
  const [policeStatusFilter, setPoliceStatusFilter] = useState("ALL");
  const [previewEvidenceImage, setPreviewEvidenceImage] = useState(null);
  const [activePoliceReportId, setActivePoliceReportId] = useState(null);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const hasMapsApiKey = Boolean(mapsApiKey);

  const loadPoliceCases = () => {
    const data = getEscalatedPoliceCases();
    setPoliceCases(data || []);
  };

  useEffect(() => {
    loadPoliceCases();
    const interval = setInterval(loadPoliceCases, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePoliceStatusChange = async (id, newStatus) => {
    try {
      await updateEscalatedCaseStatus(id, newStatus);
      setPoliceCases((prev) =>
        prev.map((c) => (String(c.id || c.complaintId) === String(id) ? { ...c, adminStatus: newStatus } : c))
      );
    } catch (e) {
      console.error("Failed to update police case status", e);
    }
  };

  const handlePoliceDelete = async (id) => {
    if (window.confirm("Remove this report from the Admin page? (The underlying data will be preserved in records)")) {
      try {
        await deleteEscalatedCase(id);
        setPoliceCases((prev) => prev.filter((c) => String(c.id || c.complaintId) !== String(id)));
      } catch (e) {
        console.error("Failed to delete police case", e);
      }
    }
  };

  // Populate top ML Zone Marking form using coordinates from a police report
  const handleUseCaseForMarking = (item) => {
    let lat = parseFloat(item.latitude || item.lat);
    let lng = parseFloat(item.longitude || item.lng);

    if (isNaN(lat) || isNaN(lng)) {
      const match = String(item.location || "").match(/Lat:\s*([0-9.-]+),\s*Lng:\s*([0-9.-]+)/i);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      } else {
        lat = 10.8948;
        lng = 76.9930;
      }
    }

    const cleanLoc = String(item.location || "").replace(/\s*\(Lat:.*?\)/i, "").trim();
    const titleVal = cleanLoc || item.category || "General Incident";
    const descVal = item.description || "Incident reported by user.";

    const reportId = item.id || item.complaintId;
    setActivePoliceReportId(reportId);

    setLatitude(lat);
    setLongitude(lng);
    setName(titleVal);
    setDescription(descVal);
    setZoneType("unsafe"); // Pre-select Unsafe (Red)

    window.scrollTo({ top: 80, behavior: "smooth" });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLatitude(DEFAULT_LOCATION.lat);
      setLongitude(DEFAULT_LOCATION.lng);
      return;
    }
    setGeoLocating(true);

    const updateCoords = (pos) => {
      const lat = parseFloat(pos.coords.latitude.toFixed(5));
      const lng = parseFloat(pos.coords.longitude.toFixed(5));
      setLatitude(lat);
      setLongitude(lng);
      setGeoLocating(false);
    };

    navigator.geolocation.getCurrentPosition(
      updateCoords,
      () => {
        navigator.geolocation.getCurrentPosition(
          updateCoords,
          (err) => {
            console.warn("Geolocation detection fallback to default safety hub:", err);
            setLatitude(DEFAULT_LOCATION.lat);
            setLongitude(DEFAULT_LOCATION.lng);
            setGeoLocating(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );
  };

  const fetchSafeZones = async () => {
    try {
      const [backendRes, mlZonesRes] = await Promise.allSettled([
        getAdminSafeZones(),
        fetchRealtimeMLMarkedZones()
      ]);

      let rawList = [];
      if (mlZonesRes.status === "fulfilled" && Array.isArray(mlZonesRes.value)) {
        rawList.push(...mlZonesRes.value);
      }
      if (backendRes.status === "fulfilled" && Array.isArray(backendRes.value?.data)) {
        rawList.push(...backendRes.value.data);
      }

      const seen = new Set();
      const combined = [];

      for (const item of rawList) {
        if (!item) continue;
        const latNum = parseFloat(item.latitude ?? item.lat ?? 0);
        const lngNum = parseFloat(item.longitude ?? item.lng ?? 0);
        if (!latNum || !lngNum) continue;

        const latVal = latNum.toFixed(5);
        const lngVal = lngNum.toFixed(5);
        const idKey = item.id ? `id:${item.id}` : null;
        const coordKey = `coord:${latVal},${lngVal}`;

        if ((idKey && seen.has(idKey)) || seen.has(coordKey)) {
          continue;
        }

        if (idKey) seen.add(idKey);
        seen.add(coordKey);

        let rawId = String(item.id || `ml_zone_admin_${Date.now()}`);
        if (!rawId.startsWith("ml_zone_")) {
          rawId = `ml_zone_${rawId.replace(/^sz_/, "")}`;
        }

        combined.push({
          ...item,
          id: rawId,
          name: item.name || item.description || "Marked Place",
          latitude: latNum,
          longitude: lngNum,
          zone: (item.zone || item.level || "safe").toLowerCase()
        });
      }

      setSafeZones(combined);
    } catch (err) {
      console.error("Failed to load safe zones:", err);
    }
  };

  useEffect(() => {
    fetchSafeZones();
  }, []);

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a location or zone title.");
      return;
    }

    setSubmitting(true);
    try {
      let color = "#00E676";
      let level = "SAFE";
      let safetyScore = 95;

      if (zoneType === "unsafe") {
        color = "#FF5252";
        level = "UNSAFE";
        safetyScore = 25;
      } else if (zoneType === "moderate") {
        color = "#FFC107";
        level = "MODERATE";
        safetyScore = 65;
      }

      try {
        const aiScore = await classifyMLZone(latitude, longitude, name, description);
        if (aiScore && aiScore.score !== undefined) {
          safetyScore = aiScore.score;
        }
      } catch (e) {
        console.warn("AI Classification fallback notice:", e);
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || `${level} risk zone marked by admin`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        zone: zoneType,
        level: level,
        color: color,
        safetyScore: safetyScore,
        radiusMeters: 400
      };

      await addAdminMLZone(payload);
      await fetchSafeZones();

      if (activePoliceReportId) {
        try {
          await deleteEscalatedCase(activePoliceReportId);
          setPoliceCases((prev) => prev.filter((c) => String(c.id || c.complaintId) !== String(activePoliceReportId)));
        } catch (e) {
          console.warn("Auto remove police report after zone marking failed:", e);
        }
        setActivePoliceReportId(null);
      }

      setName("");
      setDescription("");
      alert(`Successfully published & marked ${level} Zone on live maps!`);
    } catch (err) {
      console.error("Failed to add zone:", err);
      alert("Failed to publish zone to map.");
    } finally {
      setSubmitting(false);
    }
  };

  const mapHotspots = useMemo(() => {
    return formatMLMarkedZonesForMap(safeZones);
  }, [safeZones]);

  const handleMapClick = (ev) => {
    if (ev.detail && ev.detail.latLng) {
      const clickedLat = parseFloat(ev.detail.latLng.lat.toFixed(5));
      const clickedLng = parseFloat(ev.detail.latLng.lng.toFixed(5));
      setLatitude(clickedLat);
      setLongitude(clickedLng);
    }
  };

  // Filtered police cases
  const filteredPoliceCases = policeCases.filter((item) => {
    if (item.dismissedFromAdmin || item.adminStatus === "DISMISSED" || item.adminStatus === "ZONE_MARKED") return false;

    const status = item.adminStatus || "PENDING_ADMIN_REVIEW";
    if (policeStatusFilter !== "ALL" && status !== policeStatusFilter) return false;

    if (policeSearchQuery.trim()) {
      const q = policeSearchQuery.toLowerCase();
      const cId = String(item.complaintId || item.id || "");
      const name = String(item.userName || item.title || item.victimName || "").toLowerCase();
      const loc = String(item.location || "").toLowerCase();
      return cId.includes(q) || name.includes(q) || loc.includes(q);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="safezone-management" style={{ color: "#f8fafc" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "6px" }}>Real-Time ML Zone & Incident Map Marking</h1>
        <p style={{ color: "#9ca3af", marginBottom: "25px", fontSize: "14px" }}>
          Dynamic machine learning safety classification. Add coordinates & zone category to render live Red (Unsafe), Yellow (Moderate), and Green (Safe) map predictions.
        </p>

        {/* Top Grid: Form & Live Map */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" }}>
          
          {/* Form */}
          <div style={{ background: "#1f2937", padding: "24px", borderRadius: "16px", border: "1px solid #374151" }}>
            <h3 style={{ color: "#f3f4f6", marginTop: 0, marginBottom: "18px", fontSize: "18px", fontWeight: "700" }}>
              + Add Real-Time Marked Place / Incident Zone
            </h3>

            <form onSubmit={handleAddZone}>
              {/* Category Picker */}
              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "8px", fontWeight: "bold" }}>
                  Select ML Safety Zone Category:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setZoneType("safe")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "safe" ? "2px solid #00E676" : "1px solid #374151",
                      background: zoneType === "safe" ? "#00E6761f" : "#111827",
                      color: zoneType === "safe" ? "#00E676" : "#9ca3af",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ● Safe (Green)
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoneType("moderate")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "moderate" ? "2px solid #FFC107" : "1px solid #374151",
                      background: zoneType === "moderate" ? "#FFC1071f" : "#111827",
                      color: zoneType === "moderate" ? "#FFC107" : "#9ca3af",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ● Moderate (Yellow)
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoneType("unsafe")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "unsafe" ? "2px solid #FF5252" : "1px solid #374151",
                      background: zoneType === "unsafe" ? "#FF52521f" : "#111827",
                      color: zoneType === "unsafe" ? "#FF5252" : "#9ca3af",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ● Unsafe (Red)
                  </button>
                </div>
              </div>

              {/* Coordinates */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", color: "#9ca3af" }}>Coordinates & Map Location:</label>
                  <button
                    type="button"
                    onClick={detectCurrentLocation}
                    disabled={geoLocating}
                    style={{
                      background: "#374151",
                      color: "#60a5fa",
                      border: "none",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    🎯 {geoLocating ? "Locating..." : "Detect My Current Location"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>Latitude (Click map or type)</span>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#111827",
                        border: "1px solid #374151",
                        color: "#f3f4f6",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>Longitude (Click map or type)</span>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#111827",
                        border: "1px solid #374151",
                        color: "#f3f4f6",
                        fontSize: "14px"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Zone Title / Location Label</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Exit 2 Underpass Sector"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#111827",
                    border: "1px solid #374151",
                    color: "#f3f4f6",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#9ca3af", marginBottom: "6px" }}>Incident Description & Safety Context</label>
                <textarea
                  placeholder="Describe incident or safety parameters (e.g. Unlit corridor with past harassment reports)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    height: "80px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: "#111827",
                    border: "1px solid #374151",
                    color: "#f3f4f6",
                    fontSize: "14px",
                    resize: "none"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "none",
                  background: zoneType === "unsafe" ? "#FF5252" : zoneType === "moderate" ? "#FFC107" : "#ec4899",
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
                }}
              >
                {submitting ? "Publishing to ML Maps..." : `+ Publish & Mark ${zoneType.toUpperCase()} Zone on Map`}
              </button>
            </form>
          </div>

          {/* Live Google Map */}
          <div style={{ background: "#1f2937", padding: "20px", borderRadius: "16px", border: "1px solid #374151", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "#f3f4f6", margin: 0, fontSize: "18px" }}>Live Interactive Google Map</h3>
              <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● Real-time Sync Active</span>
            </div>

            <div style={{ flex: 1, minHeight: "360px", borderRadius: "12px", overflow: "hidden", border: "1px solid #374151" }}>
              <MapErrorBoundary>
                {hasMapsApiKey ? (
                  <APIProvider apiKey={mapsApiKey}>
                    <Map
                      center={{ lat: parseFloat(latitude) || 10.8795, lng: parseFloat(longitude) || 77.0223 }}
                      defaultCenter={{ lat: parseFloat(latitude) || 10.8795, lng: parseFloat(longitude) || 77.0223 }}
                      defaultZoom={14}
                      mapId="DEMO_MAP_ID"
                      gestureHandling="greedy"
                      onClick={handleMapClick}
                    >
                      {mapHotspots.map((z) => (
                        <Circle
                          key={z.id}
                          center={{ lat: z.lat, lng: z.lng }}
                          radius={z.radiusMeters || 400}
                          strokeColor={z.color}
                          strokeOpacity={0.9}
                          strokeWeight={2}
                          fillColor={z.color}
                          fillOpacity={0.25}
                        />
                      ))}

                      <AdvancedMarker position={{ lat: parseFloat(latitude) || DEFAULT_LOCATION.lat, lng: parseFloat(longitude) || DEFAULT_LOCATION.lng }}>
                        <Pin
                          background={zoneType === "unsafe" ? "#FF5252" : zoneType === "moderate" ? "#FFC107" : "#00E676"}
                          borderColor="#FFFFFF"
                          glyphColor="#FFFFFF"
                          scale={1.3}
                        />
                      </AdvancedMarker>
                    </Map>
                  </APIProvider>
                ) : (
                  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                    Google Maps Key required in .env
                  </div>
                )}
              </MapErrorBoundary>
            </div>

            <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: "12px", color: "#d1d5db" }}>
              <span><strong style={{ color: "#00E676" }}>● Green</strong>: Safe Zone (80-100)</span>
              <span><strong style={{ color: "#FFC107" }}>● Yellow</strong>: Moderate Risk (45-79)</span>
              <span><strong style={{ color: "#FF5252" }}>● Red</strong>: High Risk / Unsafe (0-44)</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NEW SECTION: Zone marking (Data Received from Police)                     */}
        {/* ========================================================================= */}
        <div style={{ background: "#1f2937", padding: "24px", borderRadius: "16px", border: "1px solid #374151", marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <div>
              <h2 style={{ color: "#f3f4f6", fontSize: "22px", margin: "0 0 4px 0", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                <IoMapOutline style={{ color: "#ec4444" }} /> Zone marking
              </h2>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                Incident reports forwarded directly by Police Officers for administrative zone classification, review, and map marking.
              </p>
            </div>

            {/* Police Search & Status Filters */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", minWidth: "220px" }}>
                <IoSearchOutline style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                <input
                  type="text"
                  placeholder="Search police reports..."
                  value={policeSearchQuery}
                  onChange={(e) => setPoliceSearchQuery(e.target.value)}
                  style={{ width: "100%", padding: "6px 12px 6px 32px", borderRadius: "6px", background: "#111827", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", outline: "none" }}
                />
              </div>

              <select
                value={policeStatusFilter}
                onChange={(e) => setPoliceStatusFilter(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", background: "#111827", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
              >
                <option value="ALL">All Police Reports</option>
                <option value="PENDING_ADMIN_REVIEW">Pending Review</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTION_TAKEN">Action Taken</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>

          {/* Police Cases List */}
          {filteredPoliceCases.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#111827", borderRadius: "12px", border: "1px dashed #374151", color: "#9ca3af" }}>
              <p style={{ margin: 0, fontSize: "14px" }}>No escalated incident records received from Police matching filters.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredPoliceCases.map((item) => {
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
                      background: "#111827",
                      borderRadius: "14px",
                      border: "1px solid #374151",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    <div>
                      {/* Title & Category */}
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ffffff", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                          <IoPersonOutline style={{ color: "#3b82f6" }} />
                          {item.category || item.title || "General Incident"}
                        </div>
                        <span style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>
                          {item.category || item.type || "General Incident"}
                        </span>
                      </div>

                      {/* Detailed Location Box */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", color: "#d1d5db", fontSize: "12px", marginBottom: "12px", background: "#1f2937", padding: "8px 10px", borderRadius: "8px", border: "1px solid #374151" }}>
                        <IoLocationOutline style={{ color: "#ef4444", fontSize: "15px", flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ lineHeight: "1.4" }}>{item.location}</span>
                      </div>

                      {/* Details Box */}
                      <div style={{ background: "#1f2937", padding: "8px 10px", borderRadius: "6px", marginBottom: "12px", border: "1px solid #374151" }}>
                        <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "700", display: "block", marginBottom: "2px" }}>DETAILS</span>
                        <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0, lineHeight: "1.4" }}>{item.description || "Incident reported by user."}</p>
                      </div>

                      {/* From & Date */}
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "14px" }}>
                        👮 From: <strong>{item.escalatedByOfficer || "Police Officer"}</strong> | <IoTimeOutline style={{ verticalAlign: "middle" }} /> {new Date(item.escalatedAt || Date.now()).toLocaleDateString()}
                      </div>

                      {/* Optional Photo */}
                      {item.imageUrl && (
                        <div style={{ marginBottom: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(59, 130, 246, 0.1)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#60a5fa", fontSize: "12px", fontWeight: "600" }}>
                              <IoImageOutline style={{ fontSize: "16px" }} /> Evidence Photo
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewEvidenceImage({ url: item.imageUrl, caseId: cId, location: item.location })}
                              style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            >
                              View Photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Use Coordinates, Details & Delete */}
                    <div style={{ borderTop: "1px solid #374151", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleUseCaseForMarking(item)}
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "none",
                          background: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 4px 12px rgba(236, 72, 153, 0.3)"
                        }}
                      >
                        📍 Use Coordinates for Zone Marking
                      </button>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Incident Case INC-${cId} Details:\n\nCategory: ${item.category || "General Incident"}\nLocation: ${item.location}\nDetails: ${item.description || "Incident reported by user."}\nFrom: ${item.escalatedByOfficer || "Police Officer"}`);
                          }}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #374151",
                            background: "#1f2937",
                            color: "#60a5fa",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          ℹ️ Details
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePoliceDelete(cId)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Existing Safe & Marked Zones Table */}
        {(() => {
          const filteredZones = safeZones.filter((sz) => {
            const cat = (sz.zone || sz.level || "safe").toLowerCase();
            if (typeFilter === "SAFE" && !cat.includes("safe")) return false;
            if (typeFilter === "MODERATE" && !cat.includes("moderate") && !cat.includes("yellow") && !cat.includes("medium")) return false;
            if (typeFilter === "UNSAFE" && !cat.includes("unsafe") && !cat.includes("red") && !cat.includes("high")) return false;

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const nameStr = (sz.name || "").toLowerCase();
              const descStr = (sz.description || "").toLowerCase();
              const idStr = String(sz.id || "").toLowerCase();
              return nameStr.includes(q) || descStr.includes(q) || idStr.includes(q);
            }
            return true;
          });

          return (
            <div className="tableBox" style={{ background: "#1f2937", padding: "20px", borderRadius: "16px", border: "1px solid #374151" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
                <h2 style={{ color: "#f3f4f6", fontSize: "20px", margin: 0, fontWeight: "700" }}>Active ML Marked Places & Verified Zones ({filteredZones.length})</h2>

                <input
                  type="text"
                  placeholder="🔍 Search Zone Title, Description, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "#111827",
                    border: "1px solid #374151",
                    color: "#f3f4f6",
                    fontSize: "14px",
                    outline: "none",
                    minWidth: "260px"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", padding: "12px 0 16px 0", borderTop: "1px solid #374151", borderBottom: "1px solid #374151", marginBottom: "16px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>Filter Zone Type:</span>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ padding: "6px 12px", borderRadius: "6px", background: "#111827", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
                >
                  <option value="ALL">🗺️ All Map Zones</option>
                  <option value="SAFE">🟢 Safe Zones Only (Green)</option>
                  <option value="MODERATE">🟡 Moderate Risk Zones (Yellow)</option>
                  <option value="UNSAFE">🔴 Unsafe / High Risk (Red)</option>
                </select>
              </div>

              {filteredZones.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No registered ML map zones matching filter criteria.</p>
              ) : (
                <table style={{ width: "100%", textAlign: "left", color: "#d1d5db", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #374151" }}>
                      <th style={{ padding: "12px" }}>Zone ID</th>
                      <th style={{ padding: "12px" }}>Location & Details</th>
                      <th style={{ padding: "12px" }}>Coordinates</th>
                      <th style={{ padding: "12px" }}>ML Risk Classification</th>
                      <th style={{ padding: "12px" }}>Safety Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZones.map((sz, idx) => {
                      const category = (sz.zone || sz.level || "safe").toLowerCase();
                      let badgeColor = "#00E676";
                      let badgeText = "Safe Zone (Green)";

                      if (category.includes("unsafe") || category.includes("red") || category.includes("high")) {
                        badgeColor = "#FF5252";
                        badgeText = "Unsafe / High Risk (Red)";
                      } else if (category.includes("moderate") || category.includes("yellow") || category.includes("medium")) {
                        badgeColor = "#FFC107";
                        badgeText = "Moderate Risk (Yellow)";
                      }

                      return (
                        <tr key={sz.id || idx} style={{ borderBottom: "1px solid #27272a" }}>
                          <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>{sz.id}</td>
                          <td style={{ padding: "12px" }}>
                            <strong style={{ color: "#f9fafb" }}>{sz.name || sz.description}</strong>
                            {sz.description && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{sz.description}</div>}
                          </td>
                          <td style={{ padding: "12px", fontSize: "13px" }}>
                            {parseFloat(sz.latitude || sz.lat || 0).toFixed(4)}, {parseFloat(sz.longitude || sz.lng || 0).toFixed(4)}
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: badgeColor,
                                background: badgeColor + "22",
                                border: `1px solid ${badgeColor}44`
                              }}
                            >
                              ● {badgeText}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontWeight: "bold", color: badgeColor }}>
                            {sz.safetyScore || sz.score || (category.includes("unsafe") ? 28 : category.includes("moderate") ? 62 : 94)} / 100
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })()}

        {/* Modal Evidence Viewer */}
        {previewEvidenceImage && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setPreviewEvidenceImage(null)}>
            <div style={{ background: "#131c31", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px", padding: "24px", maxWidth: "650px", width: "90%", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: "#ffffff", margin: "0 0 8px 0" }}>Evidence Photo — INC-{previewEvidenceImage.caseId}</h3>
              <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 16px 0" }}>📍 {previewEvidenceImage.location}</p>
              <div style={{ background: "#0b0f19", borderRadius: "12px", padding: "12px", display: "flex", justifyContent: "center", minHeight: "220px" }}>
                <img src={previewEvidenceImage.url} alt="Evidence" style={{ maxWidth: "100%", maxHeight: "50vh", objectFit: "contain" }} />
              </div>
              <button type="button" onClick={() => setPreviewEvidenceImage(null)} style={{ marginTop: "16px", alignSelf: "flex-end", background: "#3b82f6", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default SafeZoneManagement;
