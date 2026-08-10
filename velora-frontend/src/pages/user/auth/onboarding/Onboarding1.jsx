import { useNavigate } from "react-router-dom";

import image from "../../../../assets/images/onboarding-1.png";

function Onboarding1() {
  const navigate = useNavigate();
 return (
   <div className="onboarding">
    <button className="skip-btn" onClick={() => navigate("/login")}> Skip</button>
    <div className="onboarding-image">
        <img src={image} alt="Stay Safe" />
    </div>
    <div className="onboarding-content">
        <h1>Stay Safe Everywhere</h1>
        <p>
            Your personal safety companion,
            helping you stay protected
            anytime and anywhere.
        </p>
    </div>
    <button className="next-btn" onClick={() => navigate("/onboarding2")}>Next →</button>
</div>
 );
}
export default Onboarding1;