import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../../common/Button/Button";
import Input from "../../../../common/Input/Input";
import { addEmergencyContact } from "../../../../api/emergencyContactApi";

function AddEmergencyContact() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([
       {
            name: "",
            relationship: "",
            phone: ""
        }
    ]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (index, field, value) => {
       const updatedContacts = [...contacts];
       updatedContacts[index][field] = value;
       setContacts(updatedContacts);
    };

    const addContact = () => {
        setContacts([
            ...contacts,
            {
                name: "",
                relationship: "",
                phone: ""
            }
        ]);
    };

    const removeContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const saveContacts = async () => {
        setError("");

        const validContacts = contacts.filter(
            (c) => c.name.trim() && c.phone.trim()
        );

        if (validContacts.length === 0) {
            setError("Please add at least one contact with a name and phone number.");
            return;
        }

        setSaving(true);
        try {
            for (const contact of validContacts) {
                await addEmergencyContact({
                    name: contact.name.trim(),
                    phone: contact.phone.trim(),
                    relation: contact.relationship.trim(),
                    isPrimary: false,
                });
            }
            navigate("/emergency-contacts");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Could not save contacts. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
       <div className="contact">
           <div className="contact-container">
               <h1>Add Emergency Contact</h1>
                <p> Add trusted people who will receive your emergency alerts. </p>

                {error && (
                    <p style={{ color: "#ff4d4f", marginBottom: "10px" }}>{error}</p>
                )}

                {contacts.map((contact, index) => (
                    <div key={index}  className="contact-group" >
                      <h1>Contact {index + 1}</h1>
                        <Input type="text" placeholder="Contact Name" value={contact.name} onChange={(e) => handleChange(index, "name", e.target.value)}/>
                        <Input type="text" placeholder="Relationship" value={contact.relationship} onChange={(e) =>handleChange(index, "relationship", e.target.value)}/>
                        <Input type="text" placeholder="Mobile Number" value={contact.phone} onChange={(e) =>handleChange(index, "phone", e.target.value)}/>
                        {contacts.length > 1 && (
                            <button
                                type="button"
                                className="btn"
                                style={{ background: "transparent", color: "#ff4d4f", marginTop: "4px" }}
                                onClick={() => removeContact(index)}
                            >
                                Remove
                            </button>
                        )}
                   </div>
                ))}
                <div className="button-group">
                <Button text="+ Add Another Contact"  onClick={addContact} />
                <Button text={saving ? "Saving..." : "Save Contacts"} onClick={saveContacts} disabled={saving}/>
                </div>
            </div>
        </div>
    );
}
export default AddEmergencyContact;
