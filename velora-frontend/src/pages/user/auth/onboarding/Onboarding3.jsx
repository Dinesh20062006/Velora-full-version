import { useNavigate } from "react-router-dom";
import image from "../../../../assets/images/onboarding-3.png";
function Onboarding3() {
  const navigate = useNavigate();
  return (
    <div className="onboarding">
      <button className="skip-btn" onClick={() => navigate("/login")}>Skip</button>
      <div className="onboarding-image">
        <img src={image} alt="Emergency SOS" />
      </div>
      <div className="onboarding-content">
        <h1>Instant SOS Protection</h1>
        <p>Send emergency alerts,share your live location,and get help instantly with one tap.</p>
      </div>
      <div className="buttons">
        <button className="previous-btn" onClick={() => navigate("/onboarding2")}>← Previous</button>
        <button className="next-btn" onClick={() => navigate("/login")}>Get Started</button>
      </div>
    </div>
  );
}
export default Onboarding3;