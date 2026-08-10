import {useNavigate} from "react-router-dom";
function SOSCard() {
  const navigate = useNavigate();
  return (
    <div className="sos-card">
      <h2>Emergency SOS</h2>
      <button className="sos-button" onClick={() => navigate("/sos")}>SOS</button>
      <p>Press and hold the SOS button to instantly alert your emergency contacts and nearby authorities.</p>
    </div>
  );
}
export default SOSCard;