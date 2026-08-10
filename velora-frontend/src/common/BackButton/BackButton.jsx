import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function BackButton({ to }) {
    const navigate = useNavigate();
    return (
        <FiArrowLeft  className="back-arrow"  onClick={() => to ? navigate(to) : navigate(-1)} />
    );
}
export default BackButton;