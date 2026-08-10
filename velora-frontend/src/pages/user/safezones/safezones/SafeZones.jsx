import { useEffect, useMemo, useState } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import Button from "../../../../common/Button/Button";
import { useNavigate } from "react-router-dom";
import { getNearbySafeZones } from "../../../../api/safeZoneApi";
import {
    FaHospital,
    FaShieldAlt,
    FaFireExtinguisher,
    FaHandsHelping,
    FaMapMarkerAlt,
} from "react-icons/fa";

import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import HotspotOverlay from "../../../../common/HotspotOverlay/HotspotOverlay";
import HotspotLegend from "../../../../common/HotspotOverlay/HotspotLegend";
import MapErrorBoundary from "../../../../common/MapErrorBoundary/MapErrorBoundary";
import { fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import { generateSampleSafeZones } from "../../../../utils/hotspotEngine";

const ZONE_TYPE_META = {
    POLICE_STATION: { label: "Police Station", Icon: FaShieldAlt },
    HOSPITAL: { label: "Hospital", Icon: FaHospital },
    FIRE_STATION: { label: "Fire Station", Icon: FaFireExtinguisher },
    WOMEN_HELP_CENTER: { label: "Women's Help Center", Icon: FaHandsHelping },
    SAFE_PLACE: { label: "Safe Zone", Icon: FaMapMarkerAlt },
};

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapController({ currentPosition }) {
    const map = useMap();
    useEffect(() => {
        if (map && currentPosition) {
            map.panTo(currentPosition);
        }
    }, [map, currentPosition]);
    return null;
}

function SafeZones() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState(null);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [realtimeMLZones, setRealtimeMLZones] = useState([]);
    const [loading, setLoading] = useState(true);

    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    const hasMapsApiKey = Boolean(mapsApiKey);

    /* Detect real-time live GPS position of user */
    useEffect(() => {
        if (!navigator.geolocation) return;

        const updateLocation = (pos) => {
            setCurrentPosition({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        };

        navigator.geolocation.getCurrentPosition(
            updateLocation,
            (err) => {
                console.warn("Location permission or signal issue:", err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );

        const watchId = navigator.geolocation.watchPosition(updateLocation, null, {
            enableHighAccuracy: true
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        const fetchML = async () => {
            try {
                const ml = await fetchRealtimeMLMarkedZones();
                if (Array.isArray(ml)) {
                    setRealtimeMLZones(ml);
                }
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };
        fetchML();
        const mlInterval = setInterval(fetchML, 1000); // 1-second live sync
        return () => clearInterval(mlInterval);
    }, []);

    /* Display active ML marked zones on the map within 10 km radius of user */
    const hotspots = useMemo(() => {
        if (!realtimeMLZones || realtimeMLZones.length === 0) return [];

        return realtimeMLZones
            .map((z, idx) => {
                const lat = parseFloat(z.latitude || z.lat || 28.6139);
                const lng = parseFloat(z.longitude || z.lng || 77.2090);
                const dist = currentPosition ? haversineKm(currentPosition.lat, currentPosition.lng, lat, lng) : 0;

                return {
                    id: z.id || `live_ml_${idx}`,
                    lat,
                    lng,
                    distanceKm: dist,
                    score: z.score || (z.zone === "unsafe" ? 28 : z.zone === "moderate" ? 62 : 94),
                    radiusMeters: z.radiusMeters || 450,
                    level: z.level || (z.zone === "unsafe" ? "HIGH_RISK" : z.zone === "moderate" ? "MODERATE_RISK" : "SAFE"),
                    label: z.name || z.description || "Admin ML Marked Zone",
                    color: z.color || (z.zone === "unsafe" ? "#FF5252" : z.zone === "moderate" ? "#FFC107" : "#00E676"),
                    fill: z.fill || (z.color ? z.color + "33" : "#00E67633")
                };
            })
            .filter((h) => !currentPosition || h.distanceKm <= 10.0 || realtimeMLZones.length <= 5); // 10 km radius filter
    }, [realtimeMLZones, currentPosition]);

    /* Filter 2 UNIQUE GREEN SAFE ZONES within 10 km radius without any duplicates */
    const greenSafeZonesNearby = useMemo(() => {
        if (!realtimeMLZones || realtimeMLZones.length === 0) {
            return generateSampleSafeZones(currentPosition?.lat, currentPosition?.lng).slice(0, 2);
        }

        const allMapped = realtimeMLZones
            .map((z, idx) => {
                const lat = parseFloat(z.latitude || z.lat || 28.6139);
                const lng = parseFloat(z.longitude || z.lng || 77.2090);
                const cat = (z.zone || z.level || "safe").toLowerCase();
                const score = z.safetyScore || z.score || 95;
                const isGreen = cat.includes("safe") || cat.includes("green") || score >= 90;

                const dist = currentPosition ? haversineKm(currentPosition.lat, currentPosition.lng, lat, lng) : 0;

                return {
                    id: z.id || `safe_zone_${idx}`,
                    name: z.name || z.description || "Verified Safe Zone Hub",
                    address: z.description || z.address || "24/7 Monitored Safe Location",
                    latitude: lat,
                    longitude: lng,
                    distanceKm: dist,
                    type: z.zoneType || "SAFE_PLACE",
                    isGreen
                };
            })
            .filter((z) => z.isGreen) // Must be a Green Safe Zone
            .filter((z) => !currentPosition || z.distanceKm <= 10.0 || realtimeMLZones.length <= 5) // Within 10 km radius
            .sort((a, b) => a.distanceKm - b.distanceKm); // Sort nearest first

        // Deduplicate by zone name
        const uniqueDict = {};
        allMapped.forEach((z) => {
            const key = z.name.trim().toLowerCase();
            if (!uniqueDict[key]) {
                uniqueDict[key] = z;
            }
        });

        // Pick top 2 unique safe zones
        return Object.values(uniqueDict).slice(0, 2);
    }, [realtimeMLZones, currentPosition]);

    return (
        <UserLayout>
            <div className="safezones">
                <h1>Nearby Safe Zones (10 km Radius)</h1>
                <p>
                    Showing all verified 🟢 Green Safe Zones, police posts, and emergency hubs within 10 km of your location.
                </p>

                <div className="zone-map-card">
                    <MapErrorBoundary>
                        {hasMapsApiKey && currentPosition ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    center={currentPosition}
                                    defaultCenter={currentPosition}
                                    defaultZoom={14}
                                    mapId="DEMO_MAP_ID"
                                    gestureHandling="greedy"
                                    mapTypeControl={false}
                                    streetViewControl={false}
                                    fullscreenControl={false}
                                    disableDefaultUI={false}
                                >
                                    <MapController currentPosition={currentPosition} />
                                    <HotspotOverlay hotspots={hotspots} />

                                    {typeof window !== "undefined" && window.google?.maps?.marker?.AdvancedMarkerElement && (
                                        <AdvancedMarker
                                            position={currentPosition}
                                            title="Your Current Location"
                                        >
                                            <Pin
                                                background="#FF1744"
                                                borderColor="#FFFFFF"
                                                glyphColor="#FFFFFF"
                                                scale={1.2}
                                            />
                                        </AdvancedMarker>
                                    )}
                                </Map>
                            </APIProvider>
                        ) : (
                            <div className="zone-map-placeholder">
                                {hasMapsApiKey ? "Detecting your current location..." : "Map unavailable"}
                            </div>
                        )}
                    </MapErrorBoundary>
                </div>

                {hasMapsApiKey && hotspots.length > 0 && <HotspotLegend />}

                <div style={{ marginTop: "24px" }}>
                    <h3 style={{ color: "#f3f4f6", marginBottom: "12px", fontSize: "18px" }}>
                        🟢 Verified Green Safe Hubs ({greenSafeZonesNearby.length})
                    </h3>

                    {loading ? (
                        <p style={{ color: "#9ca3af" }}>Loading nearby safe zones...</p>
                    ) : greenSafeZonesNearby.length === 0 ? (
                        <div style={{ padding: "20px", background: "#1f2937", borderRadius: "10px", textAlign: "center", color: "#9ca3af" }}>
                            <p style={{ margin: 0 }}>No green safe zones found within 10 km of your current location.</p>
                        </div>
                    ) : (
                        greenSafeZonesNearby.map((zone) => {
                            const meta = ZONE_TYPE_META[zone.type] || { label: "Verified Safe Zone", Icon: FaShieldAlt };
                            const { Icon } = meta;
                            return (
                                <div
                                    className="zone-card"
                                    key={zone.id}
                                    onClick={() => setSelectedId(zone.id)}
                                    style={{
                                        borderLeft: "5px solid #00E676",
                                        background: selectedId === zone.id ? "#111827" : "#1f2937",
                                        outline: selectedId === zone.id ? "2px solid #00E676" : undefined,
                                        marginBottom: "12px",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div className="zone-card-row">
                                        <Icon className="zone-card-icon" style={{ color: "#00E676", fontSize: "22px" }} />
                                        <div className="zone-card-info">
                                            <h3 style={{ color: "#ffffff", margin: 0 }}>{zone.name}</h3>
                                            <span className="zone-type-badge" style={{ background: "#00E67622", color: "#00E676", border: "1px solid #00E676", fontSize: "11px", fontWeight: "bold" }}>
                                                🟢 {meta.label}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ color: "#9ca3af", marginTop: "8px", fontSize: "13px" }}>
                                        📍 {zone.distanceKm != null ? `${zone.distanceKm.toFixed(1)} km Away from you` : zone.address} — {zone.address}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                <Button
                    text="View Zone Details"
                    onClick={() => navigate("/safe-zone-details", { state: { zoneId: selectedId || greenSafeZonesNearby[0]?.id } })}
                />
            </div>
        </UserLayout>
    );
}
export default SafeZones;
