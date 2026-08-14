import { useEffect, useState } from "react";
import UserLayout from "../../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaPhoneAlt, FaPlus, FaTrash, FaEdit, FaSave } from "react-icons/fa";
import { getEmergencyContacts, deleteEmergencyContact, updateEmergencyContact } from "../../../../api/emergencyContactApi";

function EmergencyContacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    // Edit state
    const [editingContact, setEditingContact] = useState(null);
    const [editForm, setEditForm] = useState({
        name: "",
        phone: "",
        relation: "",
        primary: false
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function fetchContacts() {
            setLoading(true);
            setError("");
            try {
                const res = await getEmergencyContacts();
                if (cancelled) return;
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
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                        "Could not load your emergency contacts."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchContacts();
        return () => { cancelled = true; };
    }, []);

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

    const handleOpenEdit = (contact) => {
        setEditingContact(contact);
        setEditForm({
            name: contact.name || "",
            phone: contact.phone || "",
            relation: contact.relation || "Emergency Contact",
            primary: Boolean(contact.primary)
        });
        setEditError("");
    };

    const handleCloseEdit = () => {
        setEditingContact(null);
        setEditError("");
    };

    const handleSaveEdit = async (e) => {
        e?.preventDefault();
        if (!editForm.name.trim() || !editForm.phone.trim()) {
            setEditError("Name and mobile number are required.");
            return;
        }

        setSavingEdit(true);
        setEditError("");

        try {
            const updatedPayload = {
                name: editForm.name.trim(),
                phone: editForm.phone.trim(),
                phoneNumber: editForm.phone.trim(),
                relation: editForm.relation.trim(),
                relationship: editForm.relation.trim(),
                primary: editForm.primary,
                isPrimary: editForm.primary
            };

            await updateEmergencyContact(editingContact.id, updatedPayload);

            setContacts((prev) =>
                prev.map((c) =>
                    c.id === editingContact.id
                        ? {
                              ...c,
                              name: updatedPayload.name,
                              phone: updatedPayload.phone,
                              relation: updatedPayload.relation,
                              primary: updatedPayload.primary
                          }
                        : c
                )
            );
            setEditingContact(null);
        } catch (err) {
            setEditError(
                err?.response?.data?.message ||
                "Could not update emergency contact. Please try again."
            );
        } finally {
            setSavingEdit(false);
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
                            <div className="contact-actions" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                <a href={`tel:${contact.phone}`} title="Call Contact">
                                    <FaPhoneAlt className="call-icon" />
                                </a>
                                <FaEdit
                                    className="edit-icon"
                                    onClick={() => handleOpenEdit(contact)}
                                    title="Edit Contact"
                                    style={{ color: "#6C63FF", cursor: "pointer", fontSize: "20px" }}
                                />
                                <FaTrash
                                    className="delete-icon"
                                    onClick={() => !deletingId && handleDelete(contact.id)}
                                    title="Delete Contact"
                                    style={{ opacity: deletingId === contact.id ? 0.5 : 1, cursor: "pointer", fontSize: "20px" }}
                                />
                            </div>
                        </div>
                    ))
                )}

                {/* Edit Contact Modal */}
                {editingContact && (
                    <div className="edit-modal-overlay">
                        <div className="edit-modal-content">
                            <div className="edit-modal-header">
                                <h2>Edit Emergency Contact</h2>
                            </div>

                            {editError && (
                                <p style={{ color: "#ff4d4f", marginBottom: "12px", fontSize: "14px" }}>
                                    {editError}
                                </p>
                            )}

                            <form onSubmit={handleSaveEdit} className="edit-modal-form">
                                <div className="form-group">
                                    <label>Contact Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="Full Name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="Phone / Mobile Number"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Relationship</label>
                                    <input
                                        type="text"
                                        value={editForm.relation}
                                        onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                                        placeholder="e.g. Parent, Spouse, Friend"
                                    />
                                </div>

                                <div className="edit-modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseEdit}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-save" disabled={savingEdit}>
                                        <FaSave /> {savingEdit ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}

export default EmergencyContacts;
