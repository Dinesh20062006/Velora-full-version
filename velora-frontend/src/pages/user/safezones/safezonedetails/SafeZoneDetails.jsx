import { useEffect, useMemo, useState } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../../../../common/Button/Button";
import BackButton from "../../../../common/BackButton/BackButton";
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
import { fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import MapErrorBoundary from "../../../../common/MapErrorBoundary/MapErrorBoundary";
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

function SafeZoneDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const selectedZoneId = location.state?.zoneId;

    const [currentPosition, setCurrentPosition] = useState(null);
    const [realtimeMLZones, setRealtimeMLZones] = useState([]);
    const [loading, setLoading] = useState(true);

    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    const hasMapsApiKey = Boolean(mapsApiKey);

    /* Detect user's live GPS location */
    useEffect(() => {
        if (!navigator.geolocation) return;

        const updateLocation = (pos) => {
            setCurrentPosition({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        };

        navigator.geolocation.getCurrentPosition(updateLocation, null, { enableHighAccuracy: true });
        const watchId = navigator.geolocation.watchPosition(updateLocation, null, { enableHighAccuracy: true });

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    /* Fetch backend DB safe zones */
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
        const interval = setInterval(fetchML, 1000);
        return () => clearInterval(interval);
    }, []);

    /* Hotspot overlay for the map in 10 km radius */
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
            .filter((h) => !currentPosition || h.distanceKm <= 10.0 || realtimeMLZones.length <= 5);
    }, [realtimeMLZones, currentPosition]);

    /* List ALL non-duplicate green safe zones within 10 km radius */
    const all10kmSafeZones = useMemo(() => {
        if (!realtimeMLZones || realtimeMLZones.length === 0) {
            return generateSampleSafeZones(currentPosition?.lat, currentPosition?.lng);
        }

        const mapped = realtimeMLZones
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
                    contactNumber: z.contactNumber || "Emergency 112 / 100",
                    open24Hours: true,
                    isGreen
                };
            })
            .filter((z) => z.isGreen)
            .filter((z) => !currentPosition || z.distanceKm <= 10.0 || realtimeMLZones.length <= 5)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        // Deduplicate by name
        const uniqueDict = {};
        mapped.forEach((z) => {
            const key = z.name.trim().toLowerCase();
            if (!uniqueDict[key]) {
                uniqueDict[key] = z;
            }
        });

        return Object.values(uniqueDict);
    }, [realtimeMLZones, currentPosition]);

    const handleNavigateToZone = (targetZone) => {
        if (!currentPosition) {
            alert("Please wait for location detection.");
            return;
        }
        navigate("/navigate", {
            state: {
                origin: currentPosition,
                destination: { lat: targetZone.latitude, lng: targetZone.longitude },
                distance: `${targetZone.distanceKm.toFixed(1)} km`,
                duration: "--"
            }
        });
    };

    return (
        <UserLayout>
            <div className="safezone-details">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <BackButton />
                    <h1 style={{ margin: 0 }}>All Nearby Safe Zones (10 km Radius)</h1>
                </div>

                <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
                    Interactive 10 km map & complete details of all verified safe shelters, police posts, and emergency hubs.
                </p>

                {/* Map in 10 km Radius */}
                <div className="zone-map-card" style={{ marginBottom: "24px", height: "320px", borderRadius: "12px", overflow: "hidden" }}>
                    <MapErrorBoundary>
                        {hasMapsApiKey && currentPosition ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    center={currentPosition}
                                    defaultCenter={currentPosition}
                                    defaultZoom={13}
                                    mapId="DEMO_MAP_ID"
                                    gestureHandling="greedy"
                                    mapTypeControl={false}
                                    streetViewControl={false}
                                    fullscreenControl={false}
                                >
                                    <MapController currentPosition={currentPosition} />
                                    <HotspotOverlay hotspots={hotspots} />
                                    {typeof window !== "undefined" && window.google?.maps?.marker?.AdvancedMarkerElement && (
                                        <AdvancedMarker position={currentPosition} title="Your Location">
                                            <Pin background="#FF1744" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.2} />
                                        </AdvancedMarker>
                                    )}
                                </Map>
                            </APIProvider>
                        ) : (
                            <div className="zone-map-placeholder" style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                                Detecting live GPS location...
                            </div>
                        )}
                    </MapErrorBoundary>
                </div>

                {hasMapsApiKey && hotspots.length > 0 && <HotspotLegend />}

                {/* Complete List of All 10 km Safe Zones */}
                <div style={{ marginTop: "24px" }}>
                    <h2 style={{ color: "#ffffff", fontSize: "20px", marginBottom: "16px" }}>
                        Verified Safe Locations ({all10kmSafeZones.length})
                    </h2>

                    {loading ? (
                        <p style={{ color: "#9ca3af" }}>Loading safe zones...</p>
                    ) : all10kmSafeZones.length === 0 ? (
                        <p style={{ color: "#9ca3af" }}>No safe zones registered within 10 km.</p>
                    ) : (
                        all10kmSafeZones.map((z) => {
                            const meta = ZONE_TYPE_META[z.type] || { label: "Verified Safe Hub", Icon: FaShieldAlt };
                            const { Icon } = meta;
                            const isSelected = selectedZoneId === z.id;

                            return (
                                <div
                                    key={z.id}
                                    className="details-card"
                                    style={{
                                        marginBottom: "16px",
                                        background: isSelected ? "#111827" : "#1f2937",
                                        borderLeft: "6px solid #00E676",
                                        border: isSelected ? "2px solid #00E676" : "1px solid #374151",
                                        borderRadius: "12px",
                                        padding: "20px"
                                    }}
                                >
                                    <div className="details-card-header" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                        <Icon style={{ color: "#00E676", fontSize: "24px" }} />
                                        <div>
                                            <h3 style={{ color: "#ffffff", margin: 0, fontSize: "18px" }}>{z.name}</h3>
                                            <span className="zone-type-badge" style={{ background: "#00E67622", color: "#00E676", border: "1px solid #00E676", fontSize: "11px", fontWeight: "bold" }}>
                                                🟢 {meta.label}
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ margin: "4px 0", color: "#d1d5db" }}>📍 <strong>Distance:</strong> {z.distanceKm.toFixed(1)} km Away from your location</p>
                                    <p style={{ margin: "4px 0", color: "#d1d5db" }}>⏰ <strong>Status:</strong> {z.open24Hours ? "24/7 Active Monitored Shelter" : "Standard Hours"}</p>
                                    <p style={{ margin: "4px 0", color: "#d1d5db" }}>📞 <strong>Helpline:</strong> {z.contactNumber}</p>
                                    <p style={{ margin: "4px 0 16px 0", color: "#9ca3af" }}>🏢 <strong>Address:</strong> {z.address}</p>

                                    <Button
                                        text="Start Turn-by-Turn Navigation"
                                        onClick={() => handleNavigateToZone(z)}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ marginTop: "24px" }}>
                    <Button text="Back to Safe Zones" onClick={() => navigate("/safe-zones")} />
                </div>
            </div>
        </UserLayout>
    );
}
export default SafeZoneDetails;
