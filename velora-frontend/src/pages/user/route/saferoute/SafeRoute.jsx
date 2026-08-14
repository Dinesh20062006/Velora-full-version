import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaCrosshairs } from "react-icons/fa";

import {
    AdvancedMarker,
    APIProvider,
    Map,
    Pin,
    useMap,
    useMapsLibrary
} from "@vis.gl/react-google-maps";

import UserLayout from "../../../../layouts/UserLayout";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import HotspotOverlay from "../../../../common/HotspotOverlay/HotspotOverlay";
import HotspotLegend from "../../../../common/HotspotOverlay/HotspotLegend";
import MapErrorBoundary from "../../../../common/MapErrorBoundary/MapErrorBoundary";

import { fetchRealtimeMLMarkedZones } from "../../../../api/mlSafetyApi";
import {
    formatMLMarkedZonesForMap,
    scoreForRoute
} from "../../../../utils/hotspotEngine";


/* Controls map movement */
function MapController({ currentPosition, recenterCount }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !currentPosition) {
            return;
        }
        map.panTo(currentPosition);
        map.setZoom(16);
    }, [map, currentPosition, recenterCount]);

    return null;
}

/* Calculates and draws the route */
function RouteRenderer({ origin, destination, onRouteFound }) {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");

    const polylinesRef = useRef([]);
    const directionsRendererRef = useRef(null);

    const [destinationPosition, setDestinationPosition] = useState(null);

    useEffect(() => {
        if (!map || !routesLibrary || !origin || !destination) {
            return;
        }

        let cancelled = false;

        const clearOldRoute = () => {
            polylinesRef.current.forEach((polyline) => {
                polyline.setMap(null);
            });
            polylinesRef.current = [];

            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
                directionsRendererRef.current = null;
            }
        };

        const calculateRoute = async () => {
            clearOldRoute();

            // 1. Try Routes V2 API
            try {
                if (routesLibrary.Route) {
                    const result = await routesLibrary.Route.computeRoutes({
                        origin,
                        destination,
                        travelMode: "DRIVING",
                        routingPreference: "TRAFFIC_AWARE",
                        fields: ["path", "distanceMeters", "durationMillis"]
                    });

                    if (cancelled) return;

                    const route = result.routes?.[0];
                    if (route && route.path?.length) {
                        const polylines = route.createPolylines({
                            polylineOptions: {
                                strokeColor: "#6C63FF",
                                strokeOpacity: 0.95,
                                strokeWeight: 6
                            }
                        });

                        polylines.forEach((polyline) => {
                            polyline.setMap(map);
                        });

                        polylinesRef.current = polylines;

                        if (window.google?.maps?.LatLngBounds) {
                            const bounds = new window.google.maps.LatLngBounds();
                            route.path.forEach((point) => {
                                bounds.extend(point);
                            });
                            map.fitBounds(bounds, 60);
                        }

                        const lastPoint = route.path[route.path.length - 1];
                        const resolvedDestination = {
                            lat: typeof lastPoint.lat === "function" ? lastPoint.lat() : lastPoint.lat,
                            lng: typeof lastPoint.lng === "function" ? lastPoint.lng() : lastPoint.lng
                        };

                        setDestinationPosition(resolvedDestination);

                        onRouteFound({
                            distance: route.distanceMeters != null ? `${(route.distanceMeters / 1000).toFixed(1)} km` : "--",
                            duration: route.durationMillis != null ? `${Math.ceil(route.durationMillis / 60000)} mins` : "--",
                            destinationPosition: resolvedDestination,
                            routePath: route.path || []
                        });
                        return;
                    }
                }
            } catch (error) {
                console.warn("Routes V2 error, trying DirectionsService fallback...", error);
            }

            // 2. Fallback to standard DirectionsService
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

                    directionsRendererRef.current = directionsRenderer;

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
                                onRouteFound({
                                    distance: leg.distance?.text || "--",
                                    duration: leg.duration?.text || "--",
                                    destinationPosition: destPos,
                                    routePath: result.routes[0].overview_path || []
                                });
                            } else {
                                alert("Could not calculate route for this destination.");
                            }
                        }
                    );
                }
            } catch (fallbackError) {
                console.error("Directions fallback error:", fallbackError);
            }
        };

        calculateRoute();

        return () => {
            cancelled = true;
            clearOldRoute();
        };
    }, [map, routesLibrary, origin, destination, onRouteFound]);

    return destinationPosition && typeof window !== "undefined" && window.google?.maps?.marker?.AdvancedMarkerElement ? (
        <AdvancedMarker position={destinationPosition} title="Destination">
            <Pin background="#EA4335" borderColor="#ffffff" glyphColor="#ffffff" glyph="B" />
        </AdvancedMarker>
    ) : null;
}

const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

function SafeRoute() {
    const navigate = useNavigate();

    const [currentPosition, setCurrentPosition] = useState(DEFAULT_LOCATION);
    const [currentLocationText, setCurrentLocationText] = useState("📍 Current Location (Detecting GPS...)");
    const [destination, setDestination] = useState("");
    const [routeRequest, setRouteRequest] = useState(null);
    const [routeInfo, setRouteInfo] = useState({
        distance: "--",
        duration: "--"
    });
    const [recenterCount, setRecenterCount] = useState(0);

    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    const hasMapsApiKey = Boolean(mapsApiKey);

    // Reverse geocode lat/lng to readable location
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                const parts = data.display_name.split(",");
                const shortAddress = parts.slice(0, 3).join(",").trim();
                return `📍 Current Location (${shortAddress || data.display_name})`;
            }
        } catch {}
        return `📍 Current Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
    };

    const updatePosition = useCallback(async (lat, lng) => {
        const pos = { lat, lng };
        setCurrentPosition(pos);
        const addrText = await reverseGeocode(lat, lng);
        setCurrentLocationText(addrText);
    }, []);

    /* Detect user's current live location */
    useEffect(() => {
        if (!navigator.geolocation) {
            setCurrentLocationText("📍 Current Location (GPS Unavailable)");
            return;
        }

        const handleSuccess = (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updatePosition(lat, lng);
        };

        const handleFallback = () => {
            updatePosition(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
        };

        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            () => {
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    handleFallback,
                    { enableHighAccuracy: true, timeout: 6000 }
                );
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );

        const watchId = navigator.geolocation.watchPosition(
            handleSuccess,
            null,
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [updatePosition]);

    const [realtimeMLZones, setRealtimeMLZones] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const fetchML = async () => {
            try {
                const ml = await fetchRealtimeMLMarkedZones(currentPosition?.lat, currentPosition?.lng);
                if (isMounted && Array.isArray(ml)) {
                    setRealtimeMLZones(ml);
                }
            } catch (err) {
                console.warn("Realtime ML zones notice:", err);
            }
        };
        fetchML();

        window.addEventListener("velora_zone_updated", fetchML);
        window.addEventListener("storage", fetchML);

        return () => {
            isMounted = false;
            window.removeEventListener("velora_zone_updated", fetchML);
            window.removeEventListener("storage", fetchML);
        };
    }, []);

    const hotspots = useMemo(() => {
        return formatMLMarkedZonesForMap(realtimeMLZones);
    }, [realtimeMLZones]);

    const currentSafety = useMemo(() => {
        if (!currentPosition) return null;
        return scoreForRoute(
            currentPosition,
            routeInfo.destinationPosition,
            hotspots,
            routeInfo.routePath || []
        );
    }, [currentPosition, routeInfo.destinationPosition, routeInfo.routePath, hotspots]);

    const handleFindRoute = () => {
        if (!currentPosition) {
            alert("Detecting live current location, please wait a moment...");
            return;
        }

        if (!destination.trim()) {
            alert("Please enter your destination.");
            return;
        }

        setRouteInfo({
            distance: "--",
            duration: "--"
        });

        // Always set starting point (origin) to live current GPS location
        setRouteRequest({
            origin: currentPosition,
            destination: destination.trim()
        });
    };

    const handleStartNavigation = () => {
        if (!routeRequest) {
            alert("Please find a route first.");
            return;
        }

        navigate("/navigate", {
            state: {
                origin: routeRequest.origin,
                destination: routeRequest.destination,
                distance: routeInfo.distance,
                duration: routeInfo.duration
            }
        });
    };

    const handleRecenter = () => {
        setRecenterCount((count) => count + 1);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                updatePosition(pos.coords.latitude, pos.coords.longitude);
            }, null, { enableHighAccuracy: true });
        }
    };

    return (
        <UserLayout>
            <div className="safe-route">
                <h1>Safe Route</h1>

                <p>Find the safest route starting from your current location.</p>

                <div className="route-form">
                    <Input
                        type="text"
                        value={currentLocationText}
                        readOnly
                        style={{ fontWeight: "600", color: "#6C63FF" }}
                    />

                    <Input
                        type="text"
                        placeholder="Enter Destination (e.g. Metro Station, Hospital, Airport)"
                        value={destination}
                        onChange={(event) =>
                            setDestination(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleFindRoute();
                            }
                        }}
                    />

                    <Button
                        text="Find Route"
                        onClick={handleFindRoute}
                    />
                </div>

                <div className="map-card">
                    <MapErrorBoundary>
                        {hasMapsApiKey ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    center={currentPosition}
                                    defaultCenter={currentPosition}
                                    defaultZoom={15}
                                    mapId="DEMO_MAP_ID"
                                    gestureHandling="greedy"
                                    mapTypeControl={false}
                                    streetViewControl={false}
                                    fullscreenControl={false}
                                    disableDefaultUI={false}
                                >
                                    <MapController
                                        currentPosition={currentPosition}
                                        recenterCount={recenterCount}
                                    />

                                    <HotspotOverlay hotspots={hotspots} />

                                    {currentPosition && (
                                        <AdvancedMarker
                                            position={currentPosition}
                                            title="Starting Point (Your Current Location)"
                                        >
                                            <Pin
                                                background="#FF1744"
                                                borderColor="#FFFFFF"
                                                glyphColor="#FFFFFF"
                                                glyph="A"
                                                scale={1.4}
                                            />
                                        </AdvancedMarker>
                                    )}

                                    {routeRequest && (
                                        <RouteRenderer
                                            origin={routeRequest.origin}
                                            destination={routeRequest.destination}
                                            onRouteFound={setRouteInfo}
                                        />
                                    )}
                                </Map>
                            </APIProvider>
                        ) : (
                            <div className="map-placeholder">
                                Maps API Key is missing. Check your .env file.
                            </div>
                        )}
                    </MapErrorBoundary>

                    <button
                        type="button"
                        className="recenter-button"
                        title="Recenter to current location"
                        onClick={handleRecenter}
                    >
                        <FaCrosshairs />
                    </button>
                </div>

                {hasMapsApiKey && hotspots.length > 0 && (
                    <HotspotLegend />
                )}

                <div className="route-info">
                    <div className="info-card">
                        <h3>Distance</h3>
                        <p>{routeInfo.distance}</p>
                    </div>

                    <div className="info-card">
                        <h3>Estimated Time</h3>
                        <p>{routeInfo.duration}</p>
                    </div>

                    <div className="info-card">
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
                                : "0 / 100"}
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
                            💡 <strong>Route Safety Advisory:</strong> {currentSafety.recommendation}
                        </p>
                    </div>
                )}

                <Button
                    text="Start Navigation"
                    onClick={handleStartNavigation}
                />
            </div>
        </UserLayout>
    );
}

export default SafeRoute;