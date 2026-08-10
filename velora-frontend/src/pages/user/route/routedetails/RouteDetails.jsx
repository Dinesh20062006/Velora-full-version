
import UserLayout from "../../../../layouts/UserLayout";
import {useNavigate} from "react-router-dom";
import Button from "../../../../common/Button/Button";
import BackButton from "../../../../common/BackButton/BackButton";

function RouteDetails() {
    const navigate = useNavigate();
    return (
        <UserLayout>
           <BackButton />
            <div className="route-details">
                <h1>Recommended Safe Route</h1>
                <div className="route-card">
                    <h3>Distance</h3>
                    <p>4.8 km</p>
                </div>
                <div className="route-card">
                    <h3>Estimated Time</h3>
                    <p>12 Minutes</p>
                </div>
                <div className="route-card">
                    <h3>Safety Score</h3>
                    <p>95 / 100</p>
                </div>
                <Button text="Start Navigation" onClick={() => navigate("/navigate")} />
            </div>
        </UserLayout>
    );
}
export default RouteDetails;