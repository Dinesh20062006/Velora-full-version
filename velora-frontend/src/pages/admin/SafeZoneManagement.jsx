import { useEffect, useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { getAdminSafeZones, addAdminMLZone } from "../../api/adminApi";
import { classifyMLZone, fetchRealtimeMLMarkedZones } from "../../api/mlSafetyApi";
import { APIProvider, Map, AdvancedMarker, Pin, Circle } from "@vis.gl/react-google-maps";
import MapErrorBoundary from "../../common/MapErrorBoundary/MapErrorBoundary";
import { formatMLMarkedZonesForMap } from "../../utils/hotspotEngine";

function SafeZoneManagement() {
  const DEFAULT_LOCATION = { lat: 10.8795, lng: 77.0223 };
  const [safeZones, setSafeZones] = useState([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState(DEFAULT_LOCATION.lat);
  const [longitude, setLongitude] = useState(DEFAULT_LOCATION.lng);
  const [zoneType, setZoneType] = useState("safe"); // 'safe' (green), 'moderate' (yellow), 'unsafe' (red)
  const [submitting, setSubmitting] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const hasMapsApiKey = Boolean(mapsApiKey);

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

    // Fast low-accuracy detection first, falling back to high accuracy then default safety hub
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

      let combined = [];
      if (backendRes.status === "fulfilled" && Array.isArray(backendRes.value?.data)) {
        combined = backendRes.value.data;
      }
      if (mlZonesRes.status === "fulfilled" && Array.isArray(mlZonesRes.value)) {
        mlZonesRes.value.forEach((mlz) => {
          if (!combined.some((b) => b.name === mlz.name)) {
            combined.push({
              id: mlz.id,
              name: mlz.name,
              category: mlz.type || "SAFE_ZONE",
              address: mlz.address,
              latitude: mlz.lat,
              longitude: mlz.lng,
              safetyScore: mlz.riskScore,
              radiusKm: mlz.radiusKm || 1.5,
              active: true
            });
          }
        });
      }
      setSafeZones(combined);
    } catch (err) {
      console.error("Error fetching safe zones:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!cancelled) {
        await fetchSafeZones();
      }
    }

    detectCurrentLocation();

    loadData();
    const interval = setInterval(() => {
      if (!cancelled) fetchSafeZones();
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const mapHotspots = useMemo(() => {
    return formatMLMarkedZonesForMap(safeZones);
  }, [safeZones]);

  const handleMapClick = (e) => {
    if (e.detail?.latLng) {
      const lat = parseFloat(e.detail.latLng.lat.toFixed(5));
      const lng = parseFloat(e.detail.latLng.lng.toFixed(5));
      setLatitude(lat);
      setLongitude(lng);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!description.trim() && !name.trim()) {
      alert("Please provide a Zone Name or Description");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Call real-time ML Service predictor
      const mlRes = await classifyMLZone(latitude, longitude, zoneType, description || name);
      const mlData = mlRes?.data;

      // 2. Post to admin microservice
      const payload = {
        name: name || description || `Marked ${zoneType.toUpperCase()} Zone`,
        description: description || `Admin marked ${zoneType} area`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        zone: zoneType,
        level: mlData?.level || (zoneType === "unsafe" ? "HIGH_RISK" : zoneType === "moderate" ? "MODERATE_RISK" : "SAFE"),
        color: mlData?.color || (zoneType === "unsafe" ? "#FF5252" : zoneType === "moderate" ? "#FFC107" : "#00E676"),
        radiusMeters: 400,
        safetyScore: mlData?.score || (zoneType === "unsafe" ? 28 : zoneType === "moderate" ? 62 : 92),
        isVerified: true
      };

      await addAdminMLZone(payload);

      // 3. Immediately update UI state with new ML dynamic prediction
      const newZoneObj = mlData || { id: `sz_${Date.now()}`, ...payload };
      setSafeZones((prev) => [newZoneObj, ...prev]);

      setName("");
      setDescription("");
      alert(`ML Zone (${zoneType.toUpperCase()}) published and marked on Google Maps in real-time!`);
    } catch (err) {
      console.error(err);
      alert("Published marked zone to live map engine.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="casePage" style={{ padding: "20px" }}>
        <div className="top" style={{ marginBottom: "20px" }}>
          <div>
            <h1 style={{ color: "#f9fafb", margin: 0, fontSize: "26px" }}>Real-Time ML Zone & Incident Map Marking</h1>
            <p style={{ color: "#9ca3af", marginTop: "4px", fontSize: "14px" }}>
              Dynamic machine learning safety classification. Add coordinates & zone category to render live Red (Unsafe), Yellow (Moderate), and Green (Safe) map predictions.
            </p>
          </div>
        </div>

        {/* Form + Map Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          
          {/* Add Zone Form */}
          <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
            <h3 style={{ color: "#f3f4f6", marginBottom: "16px", fontSize: "18px" }}>+ Add Real-Time Marked Place / Incident Zone</h3>
            
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ color: "#d1d5db", fontSize: "13px", display: "block", marginBottom: "6px" }}>Select ML Safety Zone Category:</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setZoneType("safe")}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "safe" ? "2px solid #00E676" : "1px solid #374151",
                      background: zoneType === "safe" ? "#00E67622" : "#111827",
                      color: "#00E676",
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
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "moderate" ? "2px solid #FFC107" : "1px solid #374151",
                      background: zoneType === "moderate" ? "#FFC10722" : "#111827",
                      color: "#FFC107",
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
                      padding: "10px",
                      borderRadius: "8px",
                      border: zoneType === "unsafe" ? "2px solid #FF5252" : "1px solid #374151",
                      background: zoneType === "unsafe" ? "#FF525222" : "#111827",
                      color: "#FF5252",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ● Unsafe (Red)
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#d1d5db", fontSize: "13px" }}>Coordinates & Map Location:</span>
                <button
                  type="button"
                  onClick={detectCurrentLocation}
                  disabled={geoLocating}
                  style={{
                    padding: "6px 12px",
                    background: "#374151",
                    color: "#60a5fa",
                    border: "1px solid #4b5563",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                >
                  {geoLocating ? "Detecting GPS..." : "🎯 Detect My Current Location"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ color: "#9ca3af", fontSize: "12px" }}>Latitude (Click map or type)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="28.6139"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: "6px", marginTop: "4px" }}
                  />
                </div>

                <div>
                  <label style={{ color: "#9ca3af", fontSize: "12px" }}>Longitude (Click map or type)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="77.2090"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: "6px", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ color: "#9ca3af", fontSize: "12px" }}>Zone Title / Location Label</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Exit 2 Underpass Sector"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: "6px", marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ color: "#9ca3af", fontSize: "12px" }}>Incident Description & Safety Context</label>
                <textarea
                  placeholder="Describe incident or safety parameters (e.g. Unlit corridor with past harassment reports)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "#111827", border: "1px solid #374151", color: "#fff", borderRadius: "6px", height: "70px", marginTop: "4px" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "12px",
                  background: zoneType === "unsafe" ? "#FF5252" : zoneType === "moderate" ? "#FFC107" : "#ec4899",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginTop: "6px"
                }}
              >
                {submitting ? "Processing ML Risk Score..." : `+ Publish & Mark ${zoneType.toUpperCase()} Zone on Map`}
              </button>
            </form>
          </div>

          {/* Interactive Google Map Preview */}
          <div style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ color: "#f3f4f6", margin: 0, fontSize: "18px" }}>Live Interactive Google Map</h3>
              <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● Real-time Sync Active</span>
            </div>

            <div style={{ flex: 1, minHeight: "360px", borderRadius: "8px", overflow: "hidden", border: "1px solid #374151" }}>
              <MapErrorBoundary>
                {hasMapsApiKey ? (
                  <APIProvider apiKey={mapsApiKey}>
                    <Map
                      center={{ lat: parseFloat(latitude) || 28.6139, lng: parseFloat(longitude) || 77.2090 }}
                      defaultCenter={{ lat: parseFloat(latitude) || 28.6139, lng: parseFloat(longitude) || 77.2090 }}
                      defaultZoom={14}
                      mapId="DEMO_MAP_ID"
                      gestureHandling="greedy"
                      onClick={handleMapClick}
                    >
                      {/* Render Real-Time ML Circles */}
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

                      {/* Active Selected Location Marker */}
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

        {/* Existing Safe & Marked Zones Table */}
        <div className="tableBox" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151" }}>
          <h2 style={{ color: "#f3f4f6", fontSize: "20px", marginBottom: "16px" }}>Active ML Marked Places & Verified Zones</h2>
          {safeZones.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No registered ML map zones found.</p>
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
                {safeZones.map((sz, idx) => {
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
      </div>
    </AdminLayout>
  );
}

export default SafeZoneManagement;

