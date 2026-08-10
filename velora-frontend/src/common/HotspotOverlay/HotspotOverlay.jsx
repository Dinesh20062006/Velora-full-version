import React from "react";
import { Circle, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

/**
 * Renders colored circles and markers per hotspot (green = safe, yellow = moderate,
 * red = high risk). Safely checks for AdvancedMarker support so quota limits don't crash the app.
 */
function HotspotOverlay({ hotspots }) {
  if (!hotspots || hotspots.length === 0) return null;

  const isAdvancedMarkerSupported =
    typeof window !== "undefined" &&
    Boolean(window.google?.maps?.marker?.AdvancedMarkerElement) &&
    Boolean(window.google?.maps?.marker?.PinElement);

  return (
    <>
      {hotspots.map((zone) => (
        <React.Fragment key={zone.id}>
          <Circle
            center={{ lat: zone.lat, lng: zone.lng }}
            radius={zone.radiusMeters || 400}
            strokeColor={zone.color || "#00E676"}
            strokeOpacity={0.9}
            strokeWeight={2}
            fillColor={zone.color || "#00E676"}
            fillOpacity={0.28}
          />
          {isAdvancedMarkerSupported && (
            <AdvancedMarker
              position={{ lat: zone.lat, lng: zone.lng }}
              title={`${zone.label} (${zone.level || zone.score || 'Zone'})`}
            >
              <Pin
                background={zone.color || "#00E676"}
                borderColor="#FFFFFF"
                glyphColor="#FFFFFF"
                scale={1.15}
              />
            </AdvancedMarker>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default HotspotOverlay;
