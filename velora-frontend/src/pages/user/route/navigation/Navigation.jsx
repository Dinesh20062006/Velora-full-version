import { useEffect, useMemo, useRef, useState } from "react";
import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap,
    useMapsLibrary
} from "@vis.gl/react-google-maps";

import { FaCrosshairs, FaMapMarkerAlt } from "react-icons/fa";

import UserLayout from "../../../../layouts/UserLayout";
import Button from "../../../../common/Button/Button";
import BackButton from "../../../../common/BackButton/BackButton";
import HotspotOverlay from "../../../../common/HotspotOverlay/HotspotOverlay";
import HotspotLegend from "../../../../common/HotspotOverlay/HotspotLegend";
import MapErrorBoundary from "../../../../common/MapErrorBoundary/MapErrorBoundary";

import { fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import {
    formatMLMarkedZonesForMap,
    scoreForLocation
} from "../../../../utils/hotspotEngine";

/* Recenter map when the recenter button is clicked */
function MapController({
    currentPosition,
    recenterCount
}) {
    const map = useMap();
    const previousCount = useRef(-1);

    useEffect(() => {
        if (!map || !currentPosition) {
            return;
        }

        if (previousCount.current !== recenterCount) {
            map.panTo(currentPosition);
            map.setZoom(16);

            previousCount.current = recenterCount;
        }
    }, [map, currentPosition, recenterCount]);

    return null;
}

/* Calculate and display the navigation route */
function NavigationRoute({
    origin,
    destination,
    onRouteReady
}) {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");

    const polylinesRef = useRef([]);

    const [destinationPosition, setDestinationPosition] =
        useState(null);

    useEffect(() => {
        if (
            !map ||
            !routesLibrary ||
            !origin ||
            !destination
        ) {
            return;
        }

        let cancelled = false;

        const clearRoute = () => {
            polylinesRef.current.forEach((polyline) => {
                polyline.setMap(null);
            });

            polylinesRef.current = [];
        };

        const calculateRoute = async () => {
            clearRoute();

            let resolvedDestination = null;

            try {
                const result =
                    await routesLibrary.Route.computeRoutes({
                        origin,
                        destination,

                        travelMode: "DRIVING",
                        routingPreference: "TRAFFIC_AWARE",

                        fields: [
                            "path",
                            "viewport",
                            "distanceMeters",
                            "durationMillis",
                            "legs"
                        ]
                    });

                if (cancelled) {
                    return;
                }

                const route = result.routes?.[0];
                if (route && route.path?.length) {
                    const polylines = route.createPolylines({
                        polylineOptions: {
                            strokeColor: "#6C63FF",
                            strokeOpacity: 1,
                            strokeWeight: 7
                        }
                    });

                    polylines.forEach((polyline) => {
                        polyline.setMap(map);
                    });

                    polylinesRef.current = polylines;

                    if (route.viewport) {
                        map.fitBounds(route.viewport, 60);
                    }

                    const lastPoint = route.path[route.path.length - 1];
                    resolvedDestination = {
                        lat: typeof lastPoint.lat === "function" ? lastPoint.lat() : lastPoint.lat,
                        lng: typeof lastPoint.lng === "function" ? lastPoint.lng() : lastPoint.lng
                    };
                    setDestinationPosition(resolvedDestination);

                    const firstStep = route.legs?.[0]?.steps?.[0];
                    let nextDistance = "";
                    if (firstStep?.distanceMeters != null) {
                        nextDistance = firstStep.distanceMeters >= 1000
                            ? `${(firstStep.distanceMeters / 1000).toFixed(1)} km`
                            : `${Math.round(firstStep.distanceMeters)} m`;
                    }

                    onRouteReady({
                        distance: route.distanceMeters != null ? `${(route.distanceMeters / 1000).toFixed(1)} km` : "--",
                        duration: route.durationMillis != null ? `${Math.ceil(route.durationMillis / 60000)} min` : "--",
                        nextInstruction: firstStep?.instructions || "Continue on the selected route",
                        nextDistance,
                        destinationPosition: resolvedDestination
                    });
                    return;
                }
            } catch (error) {
                console.warn("Routes V2 error, trying DirectionsService fallback...", error);
            }

            // Fallback to DirectionsService
            try {
                if (window.google?.maps?.DirectionsService) {
                    const directionsService = new window.google.maps.DirectionsService();
                    const directionsRenderer = new window.google.maps.DirectionsRenderer({
                        map: map,
                        suppressMarkers: false,
                        polylineOptions: {
                            strokeColor: "#6C63FF",
                            strokeOpacity: 0.9,
                            strokeWeight: 6
                        }
                    });

                    directionsService.route(
                        {
                            origin: origin,
                            destination: destination,
                            travelMode: window.google.maps.TravelMode?.DRIVING || "DRIVING"
                        },
                        (result, status) => {
                            if (cancelled) return;
                            if (status === "OK" && result?.routes?.[0]) {
                                directionsRenderer.setDirections(result);
                                const leg = result.routes[0].legs[0];
                                const destPos = {
                                    lat: leg.end_location.lat(),
                                    lng: leg.end_location.lng()
                                };
                                setDestinationPosition(destPos);
                                onRouteReady({
                                    distance: leg.distance?.text || "--",
                                    duration: leg.duration?.text || "--",
                                    nextInstruction: leg.steps?.[0]?.instructions?.replace(/<[^>]*>?/gm, '') || "Proceed to destination",
                                    nextDistance: leg.steps?.[0]?.distance?.text || "",
                                    destinationPosition: destPos
                                });
                            }
                        }
                    );
                }
            } catch (fallbackErr) {
                console.error("Directions fallback error:", fallbackErr);
            }
        };

        calculateRoute();

        return () => {
            cancelled = true;
            clearRoute();
        };
    }, [
        map,
        routesLibrary,
        origin,
        destination,
        onRouteReady
    ]);

    return destinationPosition ? (
        <AdvancedMarker
            position={destinationPosition}
            title="Destination"
        >
            <Pin
                background="#00C853"
                borderColor="#FFFFFF"
                glyphColor="#FFFFFF"
                glyph="D"
                scale={1.4}
            />
        </AdvancedMarker>
    ) : null;
}

function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();

    /*
     * Data passed from SafeRoute.jsx:
     * origin, destination, distance and duration
     */
    const routeData = location.state;

    const [currentPosition, setCurrentPosition] =
        useState(routeData?.origin || null);

    const [navigationInfo, setNavigationInfo] =
        useState({
            distance: routeData?.distance || "--",
            duration: routeData?.duration || "--",
            nextInstruction: "Loading next instruction...",
            nextDistance: ""
        });

    const [recenterCount, setRecenterCount] =
        useState(0);

    const mapsApiKey = import.meta.env
        .VITE_GOOGLE_MAPS_API_KEY?.trim();

    const hasMapsApiKey = Boolean(mapsApiKey);

    const [realtimeMLZones, setRealtimeMLZones] = useState([]);

    useEffect(() => {
        const fetchML = async () => {
            try {
                const ml = await fetchRealtimeMLMarkedZones(currentPosition?.lat, currentPosition?.lng);
                if (Array.isArray(ml)) {
                    setRealtimeMLZones(ml);
                }
            } catch (err) {
                console.warn("Live ML sync notice:", err);
            }
        };
        fetchML();
        const interval = setInterval(fetchML, 1000); // 1-second live sync
        return () => clearInterval(interval);
    }, [currentPosition]);

    const hotspots = useMemo(() => {
        return formatMLMarkedZonesForMap(realtimeMLZones);
    }, [realtimeMLZones]);

    const currentSafety = currentPosition
        ? scoreForLocation(
              currentPosition.lat,
              currentPosition.lng,
              hotspots
          )
        : null;

    /* Keep the current-location marker updated */
    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        const watchId =
            navigator.geolocation.watchPosition(
                (position) => {
                    setCurrentPosition({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },

                (error) => {
                    console.error(
                        "Live location error:",
                        error
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 5000
                }
            );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    /* Handle direct opening or page refresh */
    if (!routeData?.origin || !routeData?.destination) {
        return (
            <UserLayout>
                <BackButton />

                <div className="navigation">
                    <div className="navigation-header">
                        <h1>Navigation</h1>
                    </div>

                    <p style={{ color: "white" }}>
                        No route was selected. Return to the
                        Safe Route page and find a route first.
                    </p>

                    <Button
                        text="Go to Safe Route"
                        onClick={() =>
                            navigate("/safe-route")
                        }
                    />
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <BackButton />

            <div className="navigation">
                <div className="navigation-header">
                    <h1>Navigation</h1>
                </div>

                <div className="navigation-map-card" style={{ width: "100%", height: "450px", borderRadius: "12px", overflow: "hidden", border: "1px solid #374151", marginBottom: "24px", position: "relative" }}>
                    <MapErrorBoundary>
                        {hasMapsApiKey ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    defaultCenter={routeData.origin}
                                    defaultZoom={15}
                                    mapId="DEMO_MAP_ID"
                                    gestureHandling="greedy"
                                    mapTypeControl={false}
                                    streetViewControl={false}
                                    fullscreenControl={true}
                                >
                                    <MapController
                                        currentPosition={currentPosition}
                                        recenterCount={recenterCount}
                                    />

                                    <HotspotOverlay hotspots={hotspots} />

                                    {currentPosition && (
                                        <AdvancedMarker
                                            position={currentPosition}
                                            title="Your Current Location"
                                            zIndex={10}
                                        >
                                            <Pin
                                                background="#FF1744"
                                                borderColor="#FFFFFF"
                                                glyphColor="#FFFFFF"
                                                glyph="A"
                                                scale={1.5}
                                            />
                                        </AdvancedMarker>
                                    )}

                                    <NavigationRoute
                                        origin={routeData.origin}
                                        destination={routeData.destination}
                                        onRouteReady={setNavigationInfo}
                                    />
                                </Map>
                            </APIProvider>
                        ) : (
                        <div
                            style={{
                                minHeight: 320,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                textAlign: "center",
                                padding: "16px",
                                background: "#f5f7ff",
                                borderRadius: "12px",
                                color: "#2d2f43"
                            }}
                        >
                            <h3>Map unavailable</h3>
                            <p>
                                Add a Google Maps API key to the
                                app environment to enable live
                                navigation mapping.
                            </p>
                        </div>
                    )}
                    </MapErrorBoundary>

                    <button
                        type="button"
                        className="navigation-recenter-button"
                        title="Recenter to current location"
                        onClick={() =>
                            setRecenterCount(
                                (count) => count + 1
                            )
                        }
                    >
                        <FaCrosshairs />
                    </button>
                </div>

                {hasMapsApiKey && hotspots.length > 0 && (
                    <HotspotLegend />
                )}

                <div className="next-turn">
                    <FaMapMarkerAlt className="turn-icon" />

                    <div>
                        <h3>Next Turn</h3>

                        <p>
                            {navigationInfo.nextInstruction}

                            {navigationInfo.nextDistance &&
                                ` • ${navigationInfo.nextDistance}`}
                        </p>
                    </div>
                </div>

                <div className="navigation-info">
                    <div className="info-box">
                        <h3>Distance Left</h3>
                        <p>{navigationInfo.distance}</p>
                    </div>

                    <div className="info-box">
                        <h3>Estimated Time</h3>
                        <p>{navigationInfo.duration}</p>
                    </div>

                    <div className="info-box">
                        <h3>Safety Score</h3>
                        <p
                            style={
                                currentSafety
                                    ? { color: currentSafety.color }
                                    : undefined
                            }
                        >
                            {currentSafety
                                ? `${currentSafety.score} / 100`
                                : "-- / 100"}
                        </p>
                        {currentSafety && (
                            <span className="info-card-tag" style={{ background: `${currentSafety.color}22`, color: currentSafety.color, border: `1px solid ${currentSafety.color}66` }}>
                                {currentSafety.label}
                            </span>
                        )}
                    </div>
                </div>

                {currentSafety && currentSafety.recommendation && (
                    <div style={{ background: "#1f2937", padding: "14px 18px", borderRadius: "10px", marginBottom: "20px", borderLeft: `4px solid ${currentSafety.color}`, border: "1px solid #374151" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#f3f4f6", lineHeight: "1.4" }}>
                            💡 <strong>Navigation Advisory:</strong> {currentSafety.recommendation}
                        </p>
                    </div>
                )}

                <Button
                    text="End Navigation"
                    onClick={() =>
                        navigate("/safe-route")
                    }
                />
            </div>
        </UserLayout>
    );
}

export default Navigation;