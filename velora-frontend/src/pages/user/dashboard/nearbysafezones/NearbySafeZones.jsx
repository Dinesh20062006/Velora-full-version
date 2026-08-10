import { useMemo } from "react";
import {
  FaHospital,
  FaShieldAlt,
  FaFireExtinguisher,
  FaHandsHelping,
  FaMapMarkerAlt,
  FaUniversity,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { APIProvider, Map, useMap, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import HotspotOverlay from "../../../../common/HotspotOverlay/HotspotOverlay";
import HotspotLegend from "../../../../common/HotspotOverlay/HotspotLegend";
import { generateHotspots, generateSampleSafeZones } from "../../../../utils/hotspotEngine";
import { useEffect } from "react";

function MapController({ currentPosition }) {
  const map = useMap();
  useEffect(() => {
    if (map && currentPosition) {
      map.panTo(currentPosition);
    }
  }, [map, currentPosition]);
  return null;
}

const ICONS = {
  POLICE_STATION: FaShieldAlt,
  HOSPITAL: FaHospital,
  FIRE_STATION: FaFireExtinguisher,
  WOMEN_HELP_CENTER: FaHandsHelping,
  SAFE_PLACE: FaMapMarkerAlt,
};

function NearbySafeZones({ zones, loading, currentPosition }) {
  const navigate = useNavigate();

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const hasMapsApiKey = Boolean(mapsApiKey);

  const sampleZones = useMemo(() => {
    return generateSampleSafeZones(currentPosition?.lat, currentPosition?.lng);
  }, [currentPosition]);

  const displayList = (zones && zones.length > 0) ? zones : sampleZones;

  // Same deterministic mock hotspot preview shown on Dashboard's Safety
  // Score, Safe Route, Navigation, and the full Safe Zones page - purely a
  // quick visual read of the region, doesn't affect the real zones listed
  // below (those still come from the backend).
  const hotspots = useMemo(() => {
    if (!currentPosition) return [];
    return generateHotspots(currentPosition.lat, currentPosition.lng, {
      count: 10,
      spreadKm: 3,
    });
  }, [currentPosition]);

  return (
    <div className="safezones">
      <h2>Nearby Safe Zones</h2>

      <div className="zone-map-card zone-map-card-compact">
        {hasMapsApiKey && currentPosition ? (
          <APIProvider apiKey={mapsApiKey}>
            <Map
              defaultCenter={currentPosition}
              defaultZoom={13}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              zoomControl={false}
            >
              <MapController currentPosition={currentPosition} />
              <HotspotOverlay hotspots={hotspots} />
              {currentPosition && (
                <AdvancedMarker position={currentPosition} title="Your Current Location">
                  <Pin background="#FF1744" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.3} />
                </AdvancedMarker>
              )}
            </Map>
          </APIProvider>
        ) : (
          <div className="zone-map-placeholder">
            {hasMapsApiKey ? "Detecting your current location..." : "Map unavailable"}
          </div>
        )}
      </div>

      {hasMapsApiKey && hotspots.length > 0 && <HotspotLegend />}

      <div className="safezone-list">
        {loading ? (
          <p>Loading...</p>
        ) : (
          displayList.slice(0, 3).map((zone) => {
            const Icon = ICONS[zone.type] || FaUniversity;
            return (
              <div
                className="safezone-card"
                key={zone.id}
                onClick={() => navigate("/safe-zone-details", { state: { zoneId: zone.id } })}
              >
                <Icon className="safezone-icon" />
                <div>
                  <h3>{zone.name}</h3>
                  <p>{zone.distanceKm != null ? `${zone.distanceKm.toFixed(1)} km Away` : zone.address}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default NearbySafeZones;
