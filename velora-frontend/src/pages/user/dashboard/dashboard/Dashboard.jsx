import { useEffect, useState } from 'react'

import UserLayout from "../../../../layouts/UserLayout";

import SafetyScore from "../safetyscore/SafetyScore";
import SOSCard from "../soscard/SOSCard";
import NearbySafeZones from "../nearbysafezones/NearbySafeZones";
import EmergencyContacts from "../emergencycontacts/EmergencyContacts";
import RecentAlerts from "../recentalerts/RecentAlerts";
import MLSafetyCard from "../mlsafetycard/MLSafetyCard";

import { getDashboard } from "../../../../api/dashboardApi";
import { useAuth } from "../../../../context/AuthContext";
import { getRegionSafety } from "../../../../utils/hotspotEngine";
import { predictMLSafetyScore } from "../../../../api/mlSafetyApi";

function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Region-based safety score, generated client-side from the
  // device's current coordinates. Deterministic per region.
  const [regionSafety, setRegionSafety] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locationName, setLocationName] = useState("");

  useEffect(() => {
    let cancelled = false;

    function fetchDashboard(lat, lng) {
      const effectiveLat = lat ?? 13.0827;
      const effectiveLng = lng ?? 80.2707;

      const fallbackSafety = getRegionSafety(effectiveLat, effectiveLng).current;
      if (!cancelled) {
        setRegionSafety(fallbackSafety);
        setCurrentPosition({ lat: effectiveLat, lng: effectiveLng });
        if (lat != null && lng != null) {
          setLocationName(`GPS Verified (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`);
        } else {
          setLocationName("Region Coordinates (Default Safety Hub)");
        }
      }

      // Sync with unified AI/ML safety prediction engine
      predictMLSafetyScore(effectiveLat, effectiveLng)
        .then((mlRes) => {
          if (!cancelled && mlRes?.data) {
            setRegionSafety(mlRes.data);
          }
        })
        .catch(() => {});

      getDashboard(effectiveLat, effectiveLng)
        .then((res) => {
          if (!cancelled) setDashboard(res?.data || null);
        })
        .catch(() => {
          if (!cancelled) setDashboard(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchDashboard(pos.coords.latitude, pos.coords.longitude),
        () => fetchDashboard(undefined, undefined),
        { timeout: 6000 }
      );
    } else {
      fetchDashboard(undefined, undefined);
    }

    return () => { cancelled = true; };
  }, []);

  return (
     <UserLayout>
      <div className="dashboard">
        <div className="main">

          <h1 style={{ fontSize: "28px", color: "#f9fafb" }}>User Safety Center</h1>
          <p className="sub" style={{ color: "#9ca3af", marginBottom: "24px" }}>
            Welcome back, <strong style={{ color: "#ec4899" }}>{user?.fullName || "Citizen User"}</strong> • Guarded by Velora Protective Network
          </p>

          {/* Quick Controls Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "24px" }}>
            <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
              <SOSCard />
            </div>
            <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
              <SafetyScore
                score={regionSafety?.score}
                label={regionSafety?.label}
                color={regionSafety?.color}
                loading={loading && !regionSafety}
                locationName={locationName}
              />
            </div>
          </div>

          {/* ML Safety Intelligence Card */}
          <div style={{ marginBottom: "24px" }}>
            <MLSafetyCard lat={currentPosition?.lat} lng={currentPosition?.lng} />
          </div>



          {/* Map & Contacts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "24px" }}>
            <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
              <NearbySafeZones
                zones={dashboard?.nearbySafeZones}
                loading={loading}
                currentPosition={currentPosition}
              />
            </div>
            <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <EmergencyContacts />
            </div>
          </div>

          {/* Recent Alerts Feed */}
          <div style={{ background: "#1f2937", padding: "24px", borderRadius: "12px", border: "1px solid #374151" }}>
            <RecentAlerts alerts={dashboard?.recentAlerts} loading={loading} />
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
export default Dashboard;
