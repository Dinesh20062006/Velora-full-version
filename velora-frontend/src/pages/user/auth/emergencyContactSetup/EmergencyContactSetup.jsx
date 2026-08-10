import { useNavigate } from "react-router-dom";

import image from "../../../../assets/images/emergency-contact-setup.png";
import Button from "../../../../common/Button/Button";

function EmergencyContactSetup() {
  const navigate = useNavigate();
  return (
    <div className="setup">
      <div className="setup-container">
        <img src={image} alt="Emergency Contact" className="setup-image"/>
        <h1>Emergency Contacts</h1>
        <p>
          Add trusted contacts who will receive
          your emergency alerts and live location
          during an SOS.
        </p>
        <Button text="Add Emergency Contacts" onClick={() => navigate("/add-emergency-contact")}/>
        <button className="skip-btn" onClick={() => navigate("/dashboard")} > Skip for Now </button>
      </div>
    </div>
  );
}
export default EmergencyContactSetup;