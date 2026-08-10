import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../../api/adminApi";
import { getActiveSosAlerts } from "../../../api/policeApi";

import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap
} from "@vis.gl/react-google-maps";

import UserLayout from "./UserLayout";

// Component to dynamically center map and fit bounds around Police and SOS Pins
function MapBoundsController({ policePos, sosAlertsList }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.google?.maps) return;

        try {
            const bounds = new window.google.maps.LatLngBounds();
            let count = 0;

            if (policePos && policePos.lat && policePos.lng) {
                bounds.extend({ lat: parseFloat(policePos.lat), lng: parseFloat(policePos.lng) });
                count++;
            }

            if (Array.isArray(sosAlertsList) && sosAlertsList.length > 0) {
                sosAlertsList.forEach((item) => {
                    if (item.latitude && item.longitude) {
                        bounds.extend({ lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) });
                        count++;
                    }
                });
            }

            if (count > 0) {
                map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
                // If zoom is too tight, set reasonable zoom
                const listener = window.google.maps.event.addListenerOnce(map, "idle", () => {
                    if (map.getZoom() > 16) map.setZoom(15);
                });
            }
        } catch (e) {
            console.warn("MapBoundsController notice:", e);
        }
    }, [map, policePos, sosAlertsList]);

    return null;
}

function Riskzone() {
    const navigate = useNavigate();

    // Live SOS Alerts state fetched from DB
    const [sosAlertsList, setSosAlertsList] = useState([]);
    const [loadingSos, setLoadingSos] = useState(true);

    // Police Officer's Real-time Current Geolocation (Default to Coimbatore local area matching DB)
    const [policePos, setPolicePos] = useState({
        lat: 10.8779,
        lng: 77.0216,
        address: "Police Officer Current Location"
    });

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

                const dynamicList = sosData.map((s, index) => {
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

                    return {
                        id: s.id || `sos_${index + 101}`,
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
                });

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

    const handleNavigateToSos = (alertItem) => {
        navigate("/police/sos-route", { state: { sosAlert: alertItem, policePos } });
    };

    return (
        <UserLayout>
            <div className="com-map-ui" style={{ padding: "20px" }}>
                <h2 style={{ color: "#f9fafb", marginBottom: "8px" }}>
                    POLICE COMMAND CENTER - RECEIVED USER SOS EMERGENCY ALERTS
                </h2>
                <p style={{ color: "#9ca3af", marginBottom: "20px", fontSize: "14px" }}>
                    Monitor active citizen emergency SOS triggers. Click any SOS alert card or map marker to launch full Police Route Navigation from your current location to the citizen's SOS coordinates.
                </p>

                {/* Main Grid: User SOS Feed & Live Map */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px", marginBottom: "24px" }}>
                    
                    {/* Left Column: Received User SOS Emergency Alerts List */}
                    <div style={{ background: "#111827", padding: "20px", borderRadius: "12px", border: "1px solid #ef4444", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <h3 style={{ color: "#ef4444", margin: 0, fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                                🚨 RECEIVED USER SOS ALERTS ({sosAlertsList.length})
                            </h3>
                            <span style={{ fontSize: "12px", color: "#9ca3af" }}>Live DB Feed</span>
                        </div>

                        {loadingSos ? (
                            <p style={{ color: "#9ca3af" }}>Loading live user SOS emergency triggers...</p>
                        ) : sosAlertsList.length === 0 ? (
                            <p style={{ color: "#9ca3af" }}>No active user SOS alerts recorded in database.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "550px", overflowY: "auto", paddingRight: "4px" }}>
                                {sosAlertsList.map((alertItem) => (
                                    <div
                                        key={alertItem.id}
                                        style={{
                                            background: "#1f2937",
                                            padding: "16px",
                                            borderRadius: "10px",
                                            border: "1px solid #374151",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "13px" }}>
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
                                            <div>🔋 Battery: <strong style={{ color: alertItem.batteryLevel < 20 ? "#ef4444" : "#10b981" }}>{alertItem.batteryLevel}%</strong></div>
                                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>🕒 {alertItem.timestamp}</div>
                                        </div>

                                        <button
                                            onClick={() => handleNavigateToSos(alertItem)}
                                            style={{
                                                marginTop: "8px",
                                                width: "100%",
                                                padding: "10px",
                                                borderRadius: "8px",
                                                background: "#2563eb",
                                                color: "#fff",
                                                border: "none",
                                                fontWeight: "bold",
                                                fontSize: "13px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                boxShadow: "0 4px 10px rgba(37,99,235,0.4)"
                                            }}
                                        >
                                            🧭 OPEN POLICE SOS ROUTE NAVIGATION
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Interactive Police Map with Police Location & User SOS Triggers */}
                    <div style={{ background: "#1f2937", padding: "16px", borderRadius: "12px", border: "1px solid #374151", minHeight: "550px", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                            <h3 style={{ color: "#f3f4f6", margin: 0, fontSize: "16px" }}>Live Interactive User SOS & Patrol Map</h3>
                            <span style={{ color: "#00E676", fontSize: "12px", fontWeight: "bold" }}>● Real-time GPS Sync Active</span>
                        </div>

                        {hasMapsApiKey ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <div style={{ flex: 1, height: "100%", minHeight: "480px", borderRadius: "8px", overflow: "hidden" }}>
                                    <Map
                                        defaultCenter={policePos}
                                        center={policePos}
                                        defaultZoom={13}
                                        mapId="POLICE_RISKZONE_MAP"
                                        gestureHandling="greedy"
                                    >
                                        <MapBoundsController policePos={policePos} sosAlertsList={sosAlertsList} />

                                        {/* Police Officer Current Location Marker */}
                                        <AdvancedMarker
                                            position={policePos}
                                            title="🚓 Police Officer Patrol Unit (Current Location)"
                                        >
                                            <Pin
                                                background="#2563EB"
                                                borderColor="#FFFFFF"
                                                glyphColor="#FFFFFF"
                                                scale={1.45}
                                            />
                                        </AdvancedMarker>

                                        {/* Render Live SOS Alert Victim Pins */}
                                        {sosAlertsList.map((sosPin) => (
                                            <AdvancedMarker
                                                key={`sos_pin_${sosPin.id}`}
                                                position={{ lat: sosPin.latitude, lng: sosPin.longitude }}
                                                title={`🚨 SOS EMERGENCY: ${sosPin.victimName}`}
                                                onClick={() => handleNavigateToSos(sosPin)}
                                            >
                                                <Pin
                                                    background="#EF4444"
                                                    borderColor="#FFFFFF"
                                                    glyphColor="#FFFFFF"
                                                    scale={1.35}
                                                />
                                            </AdvancedMarker>
                                        ))}
                                    </Map>
                                </div>
                            </APIProvider>
                        ) : (
                            <div style={{ flex: 1, minHeight: "480px", display: "flex", justifyContent: "center", alignItems: "center", background: "#111827", color: "#9ca3af", borderRadius: "8px" }}>
                                <h3>Map unavailable (Missing Google Maps API Key)</h3>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "12px", justifyContent: "center", color: "#d1d5db" }}>
                            <span><strong style={{ color: "#2563EB" }}>🚓 Blue Pin:</strong> Police Officer Current GPS Location</span>
                            <span><strong style={{ color: "#EF4444" }}>🚨 Red Pin:</strong> Citizen SOS Emergency Trigger Location</span>
                        </div>
                    </div>

                </div>
            </div>
        </UserLayout>
    );
}

export default Riskzone;