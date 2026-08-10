import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPhoneAlt, FaUserCircle } from "react-icons/fa";
import { getEmergencyContacts } from "../../../../api/emergencyContactApi";

function EmergencyContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmergencyContacts()
      .then((res) => setContacts((res?.data || []).slice(0, 3)))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="emergency-contacts">
      <h2>Emergency Contacts</h2>
      <div className="contact-list">
        {loading ? (
          <p>Loading...</p>
        ) : contacts.length === 0 ? (
          <p>No emergency contacts added yet.</p>
        ) : (
          contacts.map((contact) => (
            <div className="contact-card" key={contact.id}>
              <FaUserCircle className="contact-icon" />
              <div className="contact-info">
                <h3>{contact.name}</h3>
                <p>{contact.phone}</p>
              </div>
              <a href={`tel:${contact.phone}`}>
                <FaPhoneAlt className="call-icon" />
              </a>
            </div>
          ))
        )}
      </div>
      <button className="manage-btn" onClick={() => navigate("/emergency-contacts")}>Manage Contacts</button>
    </div>
  );
}
export default EmergencyContacts;
