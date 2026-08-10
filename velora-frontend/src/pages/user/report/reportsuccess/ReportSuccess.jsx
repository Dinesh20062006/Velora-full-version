import UserLayout from "../../../../layouts/UserLayout";
import Button from "../../../../common/Button/Button";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

function ReportSuccess() {
    const navigate = useNavigate();
    const location = useLocation();
    const reportId = location.state?.reportId;

    return (
        <UserLayout>
            <div className="report-success">
                <FaCheckCircle className="success-icon"/>
                <h1>Report Submitted Successfully</h1>
                <p>
                    Thank you for reporting the incident.
                    Your report has been securely submitted
                    to the authorities for further review.
                </p>
                {reportId && (
                    <div className="report-id">
                        <h3>Report ID</h3>
                        <span>{reportId}</span>
                    </div>
                )}
                <Button text="Back to Dashboard" onClick={() => navigate("/dashboard")} />
            </div>
        </UserLayout>
    );
}
export default ReportSuccess;
