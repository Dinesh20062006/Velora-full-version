import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../../api/adminApi";
import { getActiveSosAlerts, dispatchUnit, updateSosStatus } from "../../../api/policeApi";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap
} from "@vis.gl/react-google-maps";

import UserLayout from "./UserLayout";
import {
  IoNavigateOutline,
  IoTrashOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoRadioOutline
} from "react-icons/io5";

// Component to dynamically center map and fit bounds around Police and SOS Pins
function MapBoundsController({ policePos, sosAlertsList, activeSos }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google?.maps?.LatLngBounds) return;

    try {
      const bounds = new window.google.maps.LatLngBounds();
      let count = 0;

      if (policePos && policePos.lat && policePos.lng) {
        bounds.extend({ lat: parseFloat(policePos.lat), lng: parseFloat(policePos.lng) });
        count++;
      }

      if (activeSos && activeSos.latitude && activeSos.longitude) {
        bounds.extend({ lat: parseFloat(activeSos.latitude), lng: parseFloat(activeSos.longitude) });
        count++;
      } else if (Array.isArray(sosAlertsList) && sosAlertsList.length > 0) {
        sosAlertsList.forEach((item) => {
          if (item.latitude && item.longitude) {
            bounds.extend({ lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) });
            count++;
          }
        });
      }

      if (count > 0) {
        map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
        if (window.google?.maps?.event?.addListenerOnce) {
          window.google.maps.event.addListenerOnce(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(15);
          });
        }
      }
    } catch (e) {
      console.warn("MapBoundsController notice:", e);
    }
  }, [map, policePos, sosAlertsList, activeSos]);

  return null;
}

// Component to render route polyline on map when Police clicks Navigate
function RoutePolylineRenderer({ origin, destination }) {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !origin || !destination) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const path = [
      { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) },
      { lat: parseFloat(destination.latitude || destination.lat), lng: parseFloat(destination.longitude || destination.lng) }
    ];

    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map
      });
    } else {
      polylineRef.current.setPath(path);
      polylineRef.current.setMap(map);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, origin, destination]);

  return null;
}

function Riskzone() {
  const navigate = useNavigate();

  // Active Tab: 'ACTIVE_ALERTS' or 'HISTORY'
  const [activeTab, setActiveTab] = useState("ACTIVE_ALERTS");

  // Live SOS Alerts state
  const [sosAlertsList, setSosAlertsList] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [activeSos, setActiveSos] = useState(null);
  const [loadingSos, setLoadingSos] = useState(true);

  // Police Officer's Real-time Current Geolocation
  const [policePos, setPolicePos] = useState({
    lat: 10.8779,
    lng: 77.0216,
    address: "Police Officer Current Location"
  });

  // Load SOS History from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("velora_sos_history");
      if (stored) {
        setSosHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to parse local SOS history", e);
    }
  }, []);

  // Detect Police Officer's real-time device GPS position
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPolicePos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: "Police Officer Live Device Location"
          });
        },
        (err) => {
          console.warn("Geolocation fallback to local police station", err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // Fetch User SOS Emergency Alerts directly from Database and join with Users table
  useEffect(() => {
    const fetchDBAlerts = async () => {
      setLoadingSos(true);
      try {
        const [sosRes, userListRes] = await Promise.allSettled([
          getActiveSosAlerts(),
          getAllUsers()
        ]);

        let sosData = [];
        if (sosRes.status === "fulfilled") {
          const rawData = sosRes.value?.data || sosRes.value?.content || sosRes.value;
          sosData = Array.isArray(rawData) ? rawData : (rawData?.content || []);
        }

        let userList = [];
        if (userListRes.status === "fulfilled") {
          const uData = userListRes.value?.data || userListRes.value;
          userList = Array.isArray(uData) ? uData : (uData?.users || []);
        }

        // Get list of dismissed IDs from localStorage
        const dismissedIds = new Set(
          (JSON.parse(localStorage.getItem("velora_sos_history") || "[]")).map((h) => String(h.id))
        );

        const dynamicList = sosData
          .map((s, index) => {
            const rawUserIdStr = String(s.userId || s.user_id || s.victimId || "").replace("usr_", "");
            const rawUserIdNum = parseInt(rawUserIdStr, 10);

            const matchedUser = userList.find((u) => {
              const uIdStr = String(u.id || u.userId || "").replace("usr_", "");
              const uIdNum = parseInt(uIdStr, 10);
              return (uIdNum && uIdNum === rawUserIdNum) || (uIdStr && uIdStr === rawUserIdStr);
            });

            const lat = typeof s.location === "object" ? (s.location?.latitude || 10.9029) : (s.latitude || 10.9029);
            const lng = typeof s.location === "object" ? (s.location?.longitude || 77.04167) : (s.longitude || 77.04167);
            const locAddress = typeof s.location === "object" ? s.location?.address : (s.location || s.address || "Live GPS Location");
            const alertId = s.id || `sos_${index + 101}`;

            return {
              id: alertId,
              userId: rawUserIdNum || rawUserIdStr,
              victimName: matchedUser ? (matchedUser.fullName || matchedUser.name || matchedUser.username) : (s.victimName || `Citizen User #${rawUserIdStr}`),
              victimMobile: matchedUser ? (matchedUser.mobileNumber && matchedUser.mobileNumber !== "—" ? matchedUser.mobileNumber : matchedUser.phone || matchedUser.email) : (s.victimMobile || s.phone || "+91 98765 43210"),
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              address: locAddress,
              batteryLevel: s.batteryLevel || s.battery_level || 85,
              timestamp: s.triggerTime || s.timestamp || s.createdAt || new Date().toLocaleString(),
              status: (s.status || "ACTIVE").toUpperCase()
            };
          })
          .filter((item) => !dismissedIds.has(String(item.id)));

        setSosAlertsList(dynamicList);
      } catch (err) {
        console.error("Failed to load SOS alerts in Riskzone", err);
      } finally {
        setLoadingSos(false);
      }
    };

    fetchDBAlerts();
  }, []);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const hasMapsApiKey = Boolean(mapsApiKey);

  // Navigate Action: Opens dedicated Police Map Navigation page directly to the citizen's SOS location & updates database dispatch status
  const handleNavigateToSos = async (alertItem) => {
    setActiveSos(alertItem);

    let policeOfficerId = 101;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        policeOfficerId = u.id || u.userId || 101;
      }
    } catch {
      // fallback
    }

    try {
      const cleanAlertId = String(alertItem.id || 1).replace("sos_", "");
      await dispatchUnit(cleanAlertId, { officerId: policeOfficerId });
    } catch (err) {
      console.warn("Backend dispatch update warning:", err);
    }

    navigate("/police/sos-route", { state: { sosAlert: alertItem, policePos } });
  };

  // Delete / Dismiss Action: Removes from active queue + map, stores in SOS history & posts to user notification stream
  const handleDeleteSos = async (alertItem) => {
    if (!window.confirm(`Are you sure you want to dismiss and mark SOS Alert ${alertItem.id} as handled?`)) {
      return;
    }

    let policeOfficerId = 101;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        policeOfficerId = u.id || u.userId || 101;
      }
    } catch {
      // fallback
    }

    try {
      const cleanAlertId = String(alertItem.id || 1).replace("sos_", "");
      await updateSosStatus(cleanAlertId, "RESOLVED", policeOfficerId);
    } catch (err) {
      console.warn("Backend status update warning:", err);
    }

    const dismissedRecord = {
      ...alertItem,
      status: "DISMISSED_BY_POLICE",
      dismissedAt: new Date().toLocaleString()
    };

    // 1. Update state
    setSosAlertsList((prev) => prev.filter((a) => a.id !== alertItem.id));
    setSosHistory((prev) => [dismissedRecord, ...prev]);

    if (activeSos?.id === alertItem.id) {
      setActiveSos(null);
    }

    // 2. Persist to localStorage SOS History
    try {
      const existingHistory = JSON.parse(localStorage.getItem("velora_sos_history") || "[]");
      const updatedHistory = [dismissedRecord, ...existingHistory];
      localStorage.setItem("velora_sos_history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Failed to update velora_sos_history", e);
    }

    // 3. Post notification entry for User Notification Page (/notification)
    try {
      const existingNotifs = JSON.parse(localStorage.getItem("velora_custom_notifications") || "[]");
      const userNotification = {
        id: `sos_dismiss_${alertItem.id}_${Date.now()}`,
        title: "🚨 SOS Alert Update from Police Operations",
        message: `SOS Emergency Alert (${alertItem.id}) for ${alertItem.victimName} at ${alertItem.address} has been safely acknowledged and resolved by Police Dispatch.`,
        type: "ALERT",
        read: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("velora_custom_notifications", JSON.stringify([userNotification, ...existingNotifs]));
    } catch (e) {
      console.warn("Failed to save custom notification", e);
    }
  };

  return (
    <UserLayout>
      <div className="com-map-ui" style={{ padding: "20px", maxWidth: "1500px", margin: "0 auto" }}>
        {/* Top Title & Operational Header */}
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ color: "#f9fafb", margin: "0 0 6px 0", fontSize: "24px", fontWeight: "700" }}>
              POLICE COMMAND CENTER - SOS ALERTS & PATROL MAP
            </h2>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "14px" }}>
              Monitor incoming citizen emergency SOS triggers, initiate immediate GPS route navigation, and handle alert resolution.
            </p>
          </div>

          {/* Navigation Control Bar */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE_ALERTS")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                border: activeTab === "ACTIVE_ALERTS" ? "1px solid #ef4444" : "1px solid #374151",
                background: activeTab === "ACTIVE_ALERTS" ? "#dc2626" : "#1f2937",
                color: "#ffffff"
              }}
            >
              <IoRadioOutline /> Active SOS Alerts ({sosAlertsList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                border: activeTab === "HISTORY" ? "1px solid #3b82f6" : "1px solid #374151",
                background: activeTab === "HISTORY" ? "#2563eb" : "#1f2937",
                color: "#ffffff"
              }}
            >
              <IoTimeOutline /> SOS History Logs ({sosHistory.length})
            </button>
          </div>
        </div>

        {/* Main 2-Column Interface: Left Map & Right SOS List */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
          
          {/* Left Column: Live Interactive Police GPS & Dispatch Map */}
          <div style={{ background: "#1f2937", padding: "16px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", minHeight: "620px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
              <h3 style={{ color: "#f3f4f6", margin: 0, fontSize: "16px", fontWeight: "700" }}>
                Live Interactive User SOS & Patrol Map
              </h3>
              <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● Real-time GPS Sync Active</span>
            </div>

            {activeSos && (
              <div style={{ background: "#111827", padding: "10px 14px", borderRadius: "8px", border: "1px solid #2563eb", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>
                  📍 Active Navigation Route: To <strong>{activeSos.victimName}</strong> ({activeSos.id})
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateToSos(activeSos)}
                  style={{ background: "#2563eb", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  🚀 Full Step-by-Step Route
                </button>
              </div>
            )}

            {hasMapsApiKey ? (
              <APIProvider apiKey={mapsApiKey}>
                <div style={{ flex: 1, height: "100%", minHeight: "500px", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
                  <Map
                    defaultCenter={policePos}
                    center={policePos}
                    defaultZoom={13}
                    mapId="POLICE_RISKZONE_MAP"
                    gestureHandling="greedy"
                  >
                    <MapBoundsController policePos={policePos} sosAlertsList={sosAlertsList} activeSos={activeSos} />
                    {activeSos && <RoutePolylineRenderer origin={policePos} destination={activeSos} />}

                    {/* Police Officer Current Location Marker */}
                    <AdvancedMarker position={policePos} title="🚓 Police Officer Patrol Unit">
                      <Pin background="#2563EB" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.45} />
                    </AdvancedMarker>

                    {/* Render Live SOS Alert Victim Pins */}
                    {sosAlertsList.map((sosPin) => {
                      const isSelected = activeSos?.id === sosPin.id;
                      return (
                        <AdvancedMarker
                          key={`sos_pin_${sosPin.id}`}
                          position={{ lat: sosPin.latitude, lng: sosPin.longitude }}
                          title={`🚨 SOS EMERGENCY: ${sosPin.victimName}`}
                          onClick={() => handleNavigateToSos(sosPin)}
                        >
                          <Pin
                            background={isSelected ? "#FFD700" : "#EF4444"}
                            borderColor="#FFFFFF"
                            glyphColor="#FFFFFF"
                            scale={isSelected ? 1.6 : 1.35}
                          />
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </div>
              </APIProvider>
            ) : (
              <div style={{ flex: 1, minHeight: "500px", display: "flex", justifyContent: "center", alignItems: "center", background: "#111827", color: "#9ca3af", borderRadius: "8px" }}>
                <h3>Map unavailable (Missing Google Maps API Key)</h3>
              </div>
            )}

            <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "12px", justifyContent: "center", color: "#d1d5db" }}>
              <span><strong style={{ color: "#2563EB" }}>🚓 Blue Pin:</strong> Police Officer Current GPS</span>
              <span><strong style={{ color: "#EF4444" }}>🚨 Red Pin:</strong> Citizen SOS Emergency Trigger</span>
              <span><strong style={{ color: "#FFD700" }}>⭐ Yellow Pin:</strong> Selected Active Navigation Target</span>
            </div>
          </div>

          {/* Right Column: RECEIVED USER SOS ALERTS / SOS HISTORY */}
          <div style={{ background: "#111827", padding: "20px", borderRadius: "12px", border: "1px solid #1f2937", display: "flex", flexDirection: "column" }}>
            
            {activeTab === "ACTIVE_ALERTS" ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ color: "#ef4444", margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    🚨 RECEIVED USER SOS ALERTS ({sosAlertsList.length})
                  </h3>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>Live DB Feed</span>
                </div>

                {loadingSos ? (
                  <p style={{ color: "#9ca3af" }}>Loading live user SOS emergency triggers...</p>
                ) : sosAlertsList.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", background: "#1f2937", borderRadius: "10px", border: "1px solid #374151" }}>
                    <IoCheckmarkCircleOutline style={{ fontSize: "40px", color: "#10b981", marginBottom: "10px" }} />
                    <h4 style={{ color: "#f9fafb", margin: "0 0 6px 0" }}>All SOS Alerts Handled</h4>
                    <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>There are no pending emergency citizen SOS alerts in queue.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "550px", overflowY: "auto", paddingRight: "4px" }}>
                    {sosAlertsList.map((alertItem) => {
                      const isTargeted = activeSos?.id === alertItem.id;

                      return (
                        <div
                          key={alertItem.id}
                          style={{
                            background: isTargeted ? "#1e293b" : "#1f2937",
                            padding: "16px",
                            borderRadius: "12px",
                            border: isTargeted ? "2px solid #3b82f6" : "1px solid #374151",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "13px", fontFamily: "monospace" }}>
                              {alertItem.id}
                            </span>
                            <span style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px" }}>
                              {alertItem.status}
                            </span>
                          </div>

                          <h4 style={{ color: "#f9fafb", fontSize: "16px", fontWeight: "bold", margin: "0" }}>
                            👤 {alertItem.victimName}
                          </h4>

                          <div style={{ fontSize: "13px", color: "#d1d5db", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div>📞 <strong style={{ color: "#60a5fa" }}>{alertItem.victimMobile}</strong></div>
                            <div>📍 {alertItem.address}</div>
                            <div>🌐 Lat: <strong>{alertItem.latitude}°</strong> | Lng: <strong>{alertItem.longitude}°</strong></div>
                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>🕒 {alertItem.timestamp}</div>
                          </div>

                          {/* Action Buttons: Navigate & Delete Request */}
                          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                            <button
                              type="button"
                              onClick={() => handleNavigateToSos(alertItem)}
                              style={{
                                flex: 1,
                                padding: "10px",
                                borderRadius: "8px",
                                background: isTargeted ? "#1d4ed8" : "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                fontWeight: "bold",
                                fontSize: "13px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                boxShadow: "0 4px 10px rgba(37,99,235,0.4)",
                                transition: "all 0.2s"
                              }}
                            >
                              <IoNavigateOutline style={{ fontSize: "16px" }} />
                              {isTargeted ? "Navigating..." : "Navigate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSos(alertItem)}
                              style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                background: "#1f2937",
                                color: "#ef4444",
                                border: "1px solid #dc2626",
                                fontWeight: "bold",
                                fontSize: "13px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                transition: "all 0.2s"
                              }}
                              title="Delete / Dismiss SOS Alert & Save to History"
                            >
                              <IoTrashOutline style={{ fontSize: "16px" }} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ color: "#60a5fa", margin: 0, fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                    📜 DISMISSED SOS HISTORY LOGS ({sosHistory.length})
                  </h3>
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>Audit Trail</span>
                </div>

                {sosHistory.length === 0 ? (
                  <p style={{ color: "#9ca3af" }}>No dismissed SOS alerts recorded in history yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "550px", overflowY: "auto", paddingRight: "4px" }}>
                    {sosHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          background: "#1f2937",
                          padding: "14px",
                          borderRadius: "10px",
                          border: "1px solid #374151",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "13px" }}>{item.id}</span>
                          <span style={{ background: "rgba(16,185,129,0.2)", color: "#10b981", fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "4px" }}>
                            DISMISSED & STORED
                          </span>
                        </div>
                        <h4 style={{ color: "#f9fafb", margin: 0, fontSize: "15px" }}>👤 {item.victimName}</h4>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>📍 {item.address}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>Dismissed on: {item.dismissedAt || item.timestamp}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

        </div>
      </div>
    </UserLayout>
  );
}

export default Riskzone;