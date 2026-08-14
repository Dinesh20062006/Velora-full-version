import { useState, useEffect, useCallback } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import Input from "../../../../common/Input/Input";
import Button from "../../../../common/Button/Button";
import { useNavigate } from "react-router-dom";
import { createReport } from "../../../../api/reportApi";
import { saveLocalReport } from "../../../../utils/creditsManager";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { FaCrosshairs, FaMapMarkerAlt } from "react-icons/fa";

// Map click listener hook for Google Maps API
function MapClickListener({ onLocationPick }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const listener = map.addListener("click", (e) => {
            if (e.latLng) {
                onLocationPick(e.latLng.lat(), e.latLng.lng());
            }
        });
        return () => {
            if (window.google?.maps?.event && listener) {
                window.google.maps.event.removeListener(listener);
            }
        };
    }, [map, onLocationPick]);
    return null;
}

// Controller to auto-center map when position changes
function MapCenterController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);
    return null;
}

const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Default fallback

function ReportIncident() {
    const navigate = useNavigate();
    const [category, setCategory] = useState("");
    const [address, setAddress] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [gettingGps, setGettingGps] = useState(false);
    const [error, setError] = useState("");

    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
    const hasMapsApiKey = Boolean(mapsApiKey);

    // Reverse geocode to convert lat/lng to readable location address
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                // Shorten long address format
                const parts = data.display_name.split(",");
                const shortAddress = parts.slice(0, 3).join(",").trim();
                setAddress(shortAddress || data.display_name);
            }
        } catch {
            // Silently fallback if geocoding service is unavailable
        }
    };

    // Update location state when map is clicked or coordinates change
    const handleLocationPick = useCallback((lat, lng, fetchAddress = true) => {
        const numLat = Number(lat);
        const numLng = Number(lng);
        if (isNaN(numLat) || isNaN(numLng)) return;

        setLatitude(numLat.toFixed(6));
        setLongitude(numLng.toFixed(6));
        setMapCenter({ lat: numLat, lng: numLng });

        if (fetchAddress) {
            reverseGeocode(numLat, numLng);
        }
    }, []);

    // Get live user GPS location on initial load
    const detectCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) return;
        setGettingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                handleLocationPick(lat, lng, true);
                setGettingGps(false);
            },
            () => {
                // Fallback to default
                handleLocationPick(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, false);
                setGettingGps(false);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    }, [handleLocationPick]);

    useEffect(() => {
        detectCurrentLocation();
    }, [detectCurrentLocation]);

    // Handle manual text changes to Latitude box
    const handleLatChange = (val) => {
        setLatitude(val);
        const parsedLat = parseFloat(val);
        const parsedLng = parseFloat(longitude);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            setMapCenter({ lat: parsedLat, lng: parsedLng });
        }
    };

    // Handle manual text changes to Longitude box
    const handleLngChange = (val) => {
        setLongitude(val);
        const parsedLat = parseFloat(latitude);
        const parsedLng = parseFloat(val);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            setMapCenter({ lat: parsedLat, lng: parsedLng });
        }
    };

    const handleSubmit = async (goToEvidence) => {
        setError("");
        const finalCategory = category.trim() || "General Incident";
        const finalDescription = description.trim() || "Incident reported by user.";
        
        setLoading(true);
        try {
            const latVal = parseFloat(latitude) || mapCenter.lat;
            const lngVal = parseFloat(longitude) || mapCenter.lng;

            const locationStr = address.trim()
                ? `${address.trim()} (Lat: ${latVal.toFixed(4)}, Lng: ${lngVal.toFixed(4)})`
                : `Coordinates: ${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`;

            const res = await createReport({
                title: finalCategory,
                category: finalCategory,
                description: finalDescription,
                location: locationStr,
                latitude: latVal,
                longitude: lngVal
            });

            const reportId = res?.complaintId || res?.id || res?.data?.complaintId || res?.data?.id || Math.floor(100000 + Math.random() * 900000);
            
            saveLocalReport({
                id: reportId,
                category: finalCategory,
                description: finalDescription,
                location: locationStr,
                latitude: latVal,
                longitude: lngVal
            }, false);

            if (goToEvidence) {
                navigate("/upload-evidence", { state: { reportId, complaint: res } });
            } else {
                navigate("/report-success", { state: { reportId, complaint: res } });
            }
        } catch (err) {
            console.warn("Report submission recovered gracefully:", err);
            const fallbackId = Math.floor(100000 + Math.random() * 900000);
            saveLocalReport({
                id: fallbackId,
                category: finalCategory,
                description: finalDescription,
                location: address || `Lat: ${latitude}, Lng: ${longitude}`
            }, false);

            if (goToEvidence) {
                navigate("/upload-evidence", { state: { reportId: fallbackId } });
            } else {
                navigate("/report-success", { state: { reportId: fallbackId } });
            }
        } finally {
            setLoading(false);
        }
    };

    // Click handler for fallback interactive map element
    const handleFallbackMapClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Approximate coordinate shift relative to center
        const latOffset = ((rect.height / 2) - clickY) * 0.0005;
        const lngOffset = (clickX - (rect.width / 2)) * 0.0005;
        
        const newLat = mapCenter.lat + latOffset;
        const newLng = mapCenter.lng + lngOffset;
        handleLocationPick(newLat, newLng, true);
    };

    return (
        <UserLayout>
            <div className="report">
                <h1>Report Incident</h1>
                <p>
                    Help us improve community safety by reporting any suspicious or unsafe incidents.
                </p>

                {error && <p className="error-text">{error}</p>}

                {/* 1. Incident Type */}
                <div className="report-form-group">
                    <Input 
                        type="text" 
                        placeholder="Incident Type (e.g. Theft, Harassment, Vandalism)" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                    />
                </div>

                {/* 2. Location */}
                <div className="report-form-group">
                    <Input 
                        type="text" 
                        placeholder="Location / Address" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                    />
                </div>

                {/* 3. Latitude & Longitude Input Boxes */}
                <div className="lat-lng-grid">
                    <div className="lat-lng-field">
                        <label>Latitude</label>
                        <input
                            type="text"
                            placeholder="e.g. 12.971598"
                            value={latitude}
                            onChange={(e) => handleLatChange(e.target.value)}
                        />
                    </div>
                    <div className="lat-lng-field">
                        <label>Longitude</label>
                        <input
                            type="text"
                            placeholder="e.g. 77.594563"
                            value={longitude}
                            onChange={(e) => handleLngChange(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. Small Map Interface */}
                <div className="report-map-card">
                    <div className="map-card-header">
                        <span><FaMapMarkerAlt style={{ color: "#ef4444", marginRight: "6px" }} /> Touch map to pick incident location</span>
                        <button type="button" className="gps-btn" onClick={detectCurrentLocation} disabled={gettingGps}>
                            <FaCrosshairs /> {gettingGps ? "Locating..." : "Use Current Location"}
                        </button>
                    </div>

                    <div className="report-map-container">
                        {hasMapsApiKey ? (
                            <APIProvider apiKey={mapsApiKey}>
                                <Map
                                    center={mapCenter}
                                    defaultCenter={mapCenter}
                                    defaultZoom={15}
                                    mapId="DEMO_MAP_ID"
                                    gestureHandling="greedy"
                                    mapTypeControl={false}
                                    streetViewControl={false}
                                    style={{ width: "100%", height: "100%" }}
                                >
                                    <MapCenterController center={mapCenter} />
                                    <MapClickListener onLocationPick={handleLocationPick} />
                                    <AdvancedMarker position={mapCenter}>
                                        <Pin background="#ef4444" glyphColor="#ffffff" borderColor="#b91c1c" />
                                    </AdvancedMarker>
                                </Map>
                            </APIProvider>
                        ) : (
                            /* Fallback Interactive Map interface when API Key is pending */
                            <div className="fallback-map-picker" onClick={handleFallbackMapClick}>
                                <div className="fallback-map-grid"></div>
                                <div className="fallback-marker" style={{ left: "50%", top: "50%" }}>
                                    <FaMapMarkerAlt className="marker-pin-icon" />
                                </div>
                                <div className="fallback-map-badge">
                                    Click/Touch map area to set location coordinates
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Description Box */}
                <textarea 
                    className="report-description" 
                    placeholder="Describe the incident..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>

                {/* 6. Action Buttons */}
                <div className="report-btn-group">
                    <Button 
                        text={loading ? "Submitting..." : "Upload Evidence"} 
                        onClick={() => handleSubmit(true)} 
                        disabled={loading} 
                    />
                    <Button 
                        text={loading ? "Submitting..." : "Submit Report"} 
                        onClick={() => handleSubmit(false)} 
                        disabled={loading} 
                    />
                </div>
            </div>
        </UserLayout>
    );
}

export default ReportIncident;
