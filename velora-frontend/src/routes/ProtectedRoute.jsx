import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Role-Based Access Control ProtectedRoute:
 * Usage:
 * <ProtectedRoute allowedRoles={["POLICE"]}><Policeroute /></ProtectedRoute>
 * <ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>
 * <ProtectedRoute allowedRoles={["USER"]}><Dashboard /></ProtectedRoute>
 */
function ProtectedRoute({ children, allowedRoles = [], requirePolice = false }) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    if (requirePolice || allowedRoles.includes("POLICE") || allowedRoles.includes("ROLE_POLICE")) {
      return <Navigate to="/police/login" replace />;
    }
    if (allowedRoles.includes("ADMIN") || allowedRoles.includes("ROLE_ADMIN")) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const normRole = (role || "ROLE_USER").replace("ROLE_", "").toUpperCase();

  // If police access required and user is standard USER -> redirect to User Dashboard
  if ((requirePolice || allowedRoles.includes("POLICE")) && normRole !== "POLICE") {
    return <Navigate to="/dashboard" replace />;
  }

  // If admin access required and user is not ADMIN -> redirect to User Dashboard
  if ((allowedRoles.includes("ADMIN") || allowedRoles.includes("ROLE_ADMIN")) && normRole !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  // If allowedRoles is specified, check role matching
  if (allowedRoles.length > 0) {
    const normAllowed = allowedRoles.map((r) => r.replace("ROLE_", "").toUpperCase());
    if (!normAllowed.includes(normRole)) {
      if (normRole === "POLICE") return <Navigate to="/police/dashboard" replace />;
      if (normRole === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
