import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { triggerSos } from "../../../../api/sosApi";

function SOS() {
    const navigate = useNavigate();
    const [count, setCount] = useState(5);
    const triggeredRef = useRef(false);

    useEffect(() => {
        if (count === 0) {
            if (triggeredRef.current) return;
            triggeredRef.current = true;

            const sendAlert = (lat, lng) => {
                const finalLat = (lat && lat !== 0) ? lat : 28.6139;
                const finalLng = (lng && lng !== 0) ? lng : 77.2090;
                triggerSos({ latitude: finalLat, longitude: finalLng, batteryLevel: 88 })
                    .then((res) => navigate("/emergency-alert", { state: { alert: res?.data } }))
                    .catch(() => navigate("/emergency-alert"));
            };

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => sendAlert(pos.coords.latitude, pos.coords.longitude),
                    () => sendAlert(28.6139, 77.2090),
                    { timeout: 4000, enableHighAccuracy: true }
                );
            } else {
                sendAlert(28.6139, 77.2090);
            }
            return;
        }
        const timer = setTimeout(() => setCount(count - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, navigate]);

    return (
        <div className="sos-page">
            <div className="sos-card">
                <div className="sos-circle">{count}</div>
                <h1>Emergency SOS</h1>
                <p>Emergency alert will be sent in<strong> {count} seconds</strong></p>
                <p className="cancel-text">Stay calm. Your trusted contacts will be notified shortly.</p>
                <button className="cancel-btn" onClick={() => navigate("/dashboard")}>Cancel SOS</button>
            </div>
        </div>
    );
}
export default SOS;
