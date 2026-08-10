
import UserLayout from "../../../layouts/UserLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { FiCheckCircle, FiAward } from "react-icons/fi";

function QuerySubmitted() {

    const navigate = useNavigate();
    const location = useLocation();
    const ticketId = location.state?.ticketId || `VLR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    return (

        <UserLayout>

            <div className="query-page">

                <div className="query-card">

                    <FiCheckCircle className="success-icon"/>

                    <h1>Query Submitted!</h1>

                    <p>
                        Thank you for contacting Velora Support.
                    </p>

                    <p>
                        Your support request has been stored and received successfully.
                    </p>

                    <div style={{ background: "rgba(0, 230, 118, 0.15)", border: "1px solid #00E676", color: "#00E676", padding: "10px 16px", borderRadius: "10px", margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "bold" }}>
                        <FiAward style={{ fontSize: "20px" }} /> +5 Award Credits Added to Your Profile!
                    </div>

                    <div className="ticket-box">

                        <h3>Ticket ID</h3>

                        <h2>{ticketId}</h2>

                    </div>

                    <div className="status-box">

                        <p>

                            Our support team will contact you within

                            <strong> 24 hours.</strong>

                        </p>

                    </div>

                    <button

                        className="home-btn"

                        onClick={() => navigate("/profile")}

                    >

                        Back to Profile

                    </button>

                </div>

            </div>

        </UserLayout>

    );

}

export default QuerySubmitted;