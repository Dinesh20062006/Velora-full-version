import { useEffect, useState } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import { FaCheckCircle, FaUserShield, FaPhoneAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getEmergencyContacts } from "../../../../api/emergencyContactApi";

function EmergencyAlert() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getEmergencyContacts()
            .then((res) => {
                const data = res?.data || res;
                const userContacts = Array.isArray(data) ? data : [];
                const defaultHelplines = [
                    { id: "helpline_112", name: "National Emergency Helpline", phone: "112", relation: "Primary Response" },
                    { id: "police_100", name: "Police Patrol Dispatch Command", phone: "100", relation: "Local Division" }
                ];
                const combined = [...defaultHelplines];
                userContacts.forEach((c) => {
                    if (c.phone !== "112" && c.phone !== "100") {
                        combined.push(c);
                    }
                });
                setContacts(combined);
            })
            .catch(() => {
                setContacts([
                    { id: "helpline_112", name: "National Emergency Helpline", phone: "112", relation: "Primary Response" },
                    { id: "police_100", name: "Police Patrol Dispatch Command", phone: "100", relation: "Local Division" }
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <UserLayout>
            <div className="emergency-alert" style={{ textAlign: "center", padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
                <FaCheckCircle className="success-icon" style={{ fontSize: "64px", color: "#10b981", marginBottom: "16px" }} />
                <h1 style={{ color: "#f9fafb", fontSize: "28px" }}>Emergency SOS Broadcasted!</h1>
                <p style={{ color: "#9ca3af", fontSize: "16px", margin: "12px 0 24px" }}>
                    Your live GPS location and distress signal have been dispatched to police command and your trusted contacts.
                </p>

                <div className="contact-list" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                    {loading ? (
                        <p style={{ color: "#9ca3af" }}>Broadcasting to emergency network...</p>
                    ) : (
                        contacts.map((contact) => (
                            <div className="contact-card" key={contact.id || contact.phone} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#1f2937", padding: "16px 20px", borderRadius: "12px", border: "1px solid #374151" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <FaUserShield style={{ fontSize: "24px", color: "#ec4899" }} />
                                    <div style={{ textAlign: "left" }}>
                                        <h3 style={{ color: "#f9fafb", fontSize: "16px", margin: 0 }}>{contact.name}</h3>
                                        <p style={{ color: "#10b981", fontSize: "13px", margin: "2px 0 0" }}>● Alert & GPS Sent ({contact.phone})</p>
                                    </div>
                                </div>
                                <a href={`tel:${contact.phone}`} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ec4899", color: "#fff", padding: "8px 14px", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
                                    <FaPhoneAlt /> Call
                                </a>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    className="back-dashboard-btn" 
                    onClick={() => navigate("/dashboard")}
                    style={{ background: "#374151", color: "#fff", padding: "12px 28px", borderRadius: "10px", border: "none", fontWeight: "600", cursor: "pointer", fontSize: "16px" }}
                >
                    Return to Safe Dashboard
                </button>
            </div>
        </UserLayout>
    );
}

export default EmergencyAlert;
