
import { useEffect, useState } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaPhoneAlt, FaPlus, FaTrash } from "react-icons/fa";
import { getEmergencyContacts, deleteEmergencyContact } from "../../../../api/emergencyContactApi";

function EmergencyContacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await getEmergencyContacts();
            const raw = res?.data || res;
            const list = Array.isArray(raw) ? raw : (raw?.content || []);
            setContacts(list.map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phoneNumber || c.phone,
                relation: c.relationship || c.relation || "Emergency Contact",
                primary: c.primary || c.isPrimary
            })));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Could not load your emergency contacts."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await deleteEmergencyContact(id);
            setContacts((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Could not delete this contact."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <UserLayout>
            <div className="contacts">
                <div className="contacts-header">
                    <h1>Emergency Contacts</h1>
                    <button className="add-contact-btn" onClick={() => navigate("/add-emergency-contact")}>
                        <FaPlus />
                        Add Contact
                    </button>
               </div>

                {error && (
                    <p style={{ color: "#ff4d4f", marginBottom: "10px" }}>{error}</p>
                )}

                {loading ? (
                    <p style={{ color: "#ffffff" }}>Loading contacts...</p>
                ) : contacts.length === 0 ? (
                    <div className="contact-card">
                        <div className="contact-info">
                            <h2>No emergency contacts yet</h2>
                            <p style={{ color: "#ffffff" }}>
                                Add trusted people who should be alerted during an SOS.
                            </p>
                        </div>
                    </div>
                ) : (
                    contacts.map((contact) => (
                        <div className="contact-card" key={contact.id}>
                            <FaUserCircle className="contact-icon" />
                            <div className="contact-info">
                                <h2>{contact.name}</h2>
                                <p style={{ color: "#ffffff" }}>{contact.phone}</p>
                                <span style={{ color: "#ffffff" }}>
                                    {contact.primary ? "Primary Contact" : (contact.relation || "Emergency Contact")}
                                </span>
                            </div>
                            <div className="contact-actions">
                                <a href={`tel:${contact.phone}`}>
                                    <FaPhoneAlt className="call-icon" />
                                </a>
                                <FaTrash
                                    className="delete-icon"
                                    onClick={() => !deletingId && handleDelete(contact.id)}
                                    style={{ opacity: deletingId === contact.id ? 0.5 : 1, cursor: "pointer" }}
                                />
                           </div>
                        </div>
                    ))
                )}
            </div>
        </UserLayout>
    );
}
export default EmergencyContacts;
