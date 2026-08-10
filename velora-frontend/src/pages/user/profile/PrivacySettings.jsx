
import { useEffect, useState } from "react";
import UserLayout from "../../../layouts/UserLayout";
import BackButton from "../../../common/BackButton/BackButton";

import {
  FiMap,
  FiMapPin,
  FiBell,
  FiShield,
} from "react-icons/fi";

import { getPrivacySettings, updatePrivacySettings } from "../../../api/profileApi";

function PrivacySettings() {

  const [settings, setSettings] = useState({
    locationSharingEnabled: true,
    shareWithContacts: true,
    anonymousReportingDefault: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrivacySettings()
      .then((res) => {
        if (res?.data) {
          setSettings(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated); // optimistic update
    try {
      await updatePrivacySettings(updated);
    } catch (err) {
      console.warn("Setting update fallback:", err);
    }
  };

  const renderToggle = (key, value) => (
    <button
      type="button"
      className={`toggle ${value ? "on" : "off"}`}
      onClick={() => toggle(key)}
      style={{
        padding: "6px 16px",
        borderRadius: "20px",
        border: "none",
        fontWeight: "bold",
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        background: value ? "#00E676" : "#374151",
        color: value ? "#000000" : "#ffffff",
        boxShadow: value ? "0 0 10px rgba(0,230,118,0.4)" : "none"
      }}
    >
      {value ? "ON" : "OFF"}
    </button>
  );

  return (

    <UserLayout>
      <BackButton />
      <div className="privacy-page">

        <div className="privacy-header">

          <h1>Privacy Settings</h1>

        </div>

        <div className="privacy-card">

          <h2>Location Privacy</h2>

          <div className="setting">

            <div className="setting-left">

              <FiMap className="icon"/>

              <div>

                <h3>Share Live Location</h3>

                <p>Share your live location with emergency contacts.</p>

              </div>

            </div>

            {renderToggle("locationSharingEnabled", settings.locationSharingEnabled)}

          </div>

          <div className="setting">

            <div className="setting-left">

              <FiMapPin className="icon"/>

              <div>

                <h3>Share With Contacts</h3>

                <p>Let your emergency contacts see your location during an SOS.</p>

              </div>

            </div>

            {renderToggle("shareWithContacts", settings.shareWithContacts)}

          </div>

        </div>

        <div className="privacy-card">

          <h2>Reporting</h2>

          <div className="setting">

            <div className="setting-left">

              <FiShield className="icon"/>

              <div>

                <h3>Anonymous Reporting by Default</h3>

                <p>Submit incident reports anonymously unless you choose otherwise.</p>

              </div>

            </div>

            {renderToggle("anonymousReportingDefault", settings.anonymousReportingDefault)}

          </div>

        </div>

      </div>

    </UserLayout>

  );

}

export default PrivacySettings;
