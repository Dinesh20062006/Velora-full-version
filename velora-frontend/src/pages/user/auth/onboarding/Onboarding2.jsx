import { useNavigate } from "react-router-dom";
import image from "../../../../assets/images/onboarding-2.png";
function Onboarding2() {
  const navigate = useNavigate();
  return (
    <div className="onboarding">
      <button className="skip-btn" onClick={() => navigate("/login")}>Skip</button>
      <div className="onboarding-image">
        <img src={image} alt="Live Tracking" />
      </div>
      <div className="onboarding-content">
        <h1>Share Your Live Location</h1>
        <p>Let your trusted contacts share your location in real time whenever you need help.</p>
      </div>
      <div className="buttons">
        <button className="previous-btn" onClick={() => navigate("/onboarding1")}>← Previous</button>
        <button className="next-btn" onClick={() => navigate("/onboarding3")}>Next →</button>
      </div>
    </div>
  );
}
export default Onboarding2;