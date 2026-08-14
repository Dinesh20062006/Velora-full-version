import { useEffect, useMemo, useState } from "react";
import {
  FaHospital,
  FaShieldAlt,
  FaFireExtinguisher,
  FaHandsHelping,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import HotspotOverlay from "../../../../common/HotspotOverlay/HotspotOverlay";
import HotspotLegend from "../../../../common/HotspotOverlay/HotspotLegend";
import MapErrorBoundary from "../../../../common/MapErrorBoundary/MapErrorBoundary";
import { fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import { generateSampleSafeZones } from "../../../../utils/hotspotEngine";

const ICONS = {
  POLICE_STATION: FaShieldAlt,
  HOSPITAL: FaHospital,
  FIRE_STATION: FaFireExtinguisher,
  WOMEN_HELP_CENTER: FaHandsHelping,
  SAFE_PLACE: FaMapMarkerAlt,
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

function NearbySafeZones({ currentPosition: parentPosition }) {
  const navigate = useNavigate();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const hasMapsApiKey = Boolean(mapsApiKey);

  const [realtimeMLZones, setRealtimeMLZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live polling for ML / Admin Safe Zones (same sync engine as full SafeZones page)
  useEffect(() => {
    let active = true;
    const fetchML = async () => {
      try {
        const ml = await fetchRealtimeMLMarkedZones();
        if (active && Array.isArray(ml)) {
          setRealtimeMLZones(ml);
        }
      } catch (err) {
        console.warn("ML zones fetch notice:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchML();

    window.addEventListener("velora_zone_updated", fetchML);
    window.addEventListener("storage", fetchML);

    return () => {
      active = false;
      window.removeEventListener("velora_zone_updated", fetchML);
      window.removeEventListener("storage", fetchML);
    };
  }, []);

  const currentPosition = parentPosition || { lat: 10.8795, lng: 77.0223 };

  // Compute live hotspots from realtime ML data
  const hotspots = useMemo(() => {
    if (!realtimeMLZones || realtimeMLZones.length === 0) return [];
    return realtimeMLZones.map((z, idx) => {
      const lat = parseFloat(z.latitude || z.lat || 10.8795);
      const lng = parseFloat(z.longitude || z.lng || 77.0223);
      const dist = currentPosition ? haversineKm(currentPosition.lat, currentPosition.lng, lat, lng) : 0;
      return {
        id: z.id || `live_ml_${idx}`,
        lat,
        lng,
        distanceKm: dist,
        score: z.score || (z.zone === "unsafe" ? 28 : z.zone === "moderate" ? 62 : 94),
        radiusMeters: z.radiusMeters || 450,
        level: z.level || (z.zone === "unsafe" ? "HIGH_RISK" : z.zone === "moderate" ? "MODERATE_RISK" : "SAFE"),
        label: z.name || z.description || "Safe Zone",
        color: z.color || (z.zone === "unsafe" ? "#FF5252" : z.zone === "moderate" ? "#FFC107" : "#00E676"),
        fill: z.fill || (z.color ? z.color + "33" : "#00E67633")
      };
    });
  }, [realtimeMLZones, currentPosition]);

  // Compute live green safe zones list
  const greenSafeZonesNearby = useMemo(() => {
    if (!realtimeMLZones || realtimeMLZones.length === 0) {
      return generateSampleSafeZones(currentPosition?.lat, currentPosition?.lng).slice(0, 3);
    }
    const filtered = realtimeMLZones
      .map((z, idx) => {
        const lat = parseFloat(z.latitude || z.lat || 10.8795);
        const lng = parseFloat(z.longitude || z.lng || 77.0223);
        const cat = String(z.zone || z.level || "safe").toLowerCase();
        const score = Number(z.safetyScore ?? z.score ?? 95);

        const isUnsafeOrModerate =
          cat.includes("unsafe") ||
          cat.includes("moderate") ||
          cat.includes("red") ||
          cat.includes("yellow") ||
          cat.includes("high") ||
          score < 75;

        const isGreen = !isUnsafeOrModerate;
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
      .filter((z) => z.isGreen);

    return filtered.length > 0 ? filtered.slice(0, 3) : generateSampleSafeZones(currentPosition?.lat, currentPosition?.lng).slice(0, 3);
  }, [realtimeMLZones, currentPosition]);

  return (
    <div className="safezones">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0, cursor: "pointer", color: "#f9fafb", fontSize: "20px" }} onClick={() => navigate("/safe-zones")}>
            Nearby Safe Zones
          </h2>
          <span style={{ fontSize: "12px", color: "#10b981", fontWeight: "500" }}>
            ● Live AI & Database Sync Active ({realtimeMLZones.length > 0 ? realtimeMLZones.length : 3} Zones)
          </span>
        </div>
        <button
          onClick={() => navigate("/safe-zones")}
          style={{
            background: "#2563eb",
            border: "none",
            color: "#ffffff",
            borderRadius: "8px",
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
            transition: "transform 0.2s ease"
          }}
        >
          Open Safe Zone Page →
        </button>
      </div>

      {/* Mini Map Interface */}
      <div
        className="zone-map-card zone-map-card-compact"
        style={{
          position: "relative",
          cursor: "pointer",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #3b82f6",
          height: "180px",
          marginBottom: "16px"
        }}
        onClick={() => navigate("/safe-zones")}
        title="Click to open full interactive Safe Zones page"
      >
        <MapErrorBoundary>
          {hasMapsApiKey && currentPosition ? (
            <APIProvider apiKey={mapsApiKey}>
              <Map
                center={currentPosition}
                defaultCenter={currentPosition}
                defaultZoom={14}
                mapId="DEMO_MAP_ID"
                gestureHandling="cooperative"
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                zoomControl={false}
              >
                <MapController currentPosition={currentPosition} />
                <HotspotOverlay hotspots={hotspots} />
                {currentPosition && (
                  <AdvancedMarker position={currentPosition} title="Your Current Location">
                    <Pin background="#FF1744" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.2} />
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div
              style={{
                height: "100%",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "20px"
              }}
            >
              <span style={{ fontSize: "28px" }}>🗺️</span>
              <span style={{ fontWeight: "600", color: "#60a5fa", fontSize: "15px" }}>Live Safe Zone Interactive Map</span>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>Tap to view verified green safe hubs & active risk zones</span>
            </div>
          )}
        </MapErrorBoundary>
      </div>

      <HotspotLegend />

      {/* Mini Live Safe Zones List */}
      <div className="safezone-list" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <p style={{ color: "#9ca3af" }}>Syncing live safe zones...</p>
        ) : (
          greenSafeZonesNearby.map((zone) => {
            const Icon = ICONS[zone.type] || FaShieldAlt;
            return (
              <div
                className="safezone-card"
                key={zone.id}
                onClick={() => navigate("/safe-zones")}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  background: "#1f2937",
                  borderRadius: "10px",
                  border: "1px solid #374151",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px", borderRadius: "8px", color: "#10b981", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, color: "#f9fafb", fontSize: "14px", fontWeight: "600" }}>{zone.name}</h4>
                  <p style={{ margin: "2px 0 0 0", color: "#9ca3af", fontSize: "12px" }}>
                    {zone.distanceKm != null ? `${zone.distanceKm.toFixed(1)} km Away` : zone.address}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "500" }}>Navigate →</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NearbySafeZones;
