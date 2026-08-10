import { Routes, Route, Navigate } from "react-router-dom";

import "../police style/index.css";

import Registration from "../police page/Registration.jsx";
import Login from "../police page/login.jsx";
import ForgotPassword from "../police page/ForgotPassword.jsx";
import OTP from "../police page/OTP.jsx";

import Dashboard from "../police page/Dashboard.jsx";
import RecentCases from "../police page/Recentcase.jsx";
import TodaysCase from "../police page/TodaysCase.jsx";
import PendingCases from "../police page/PendingCases.jsx";
import Riskzone from "../police page/Riskzone.jsx";
import PoliceSosRoute from "../police page/PoliceSosRoute.jsx";

import ProtectedRoute from "../../../routes/ProtectedRoute.jsx";

function Policeroute() {
  return (
    <Routes>
      {/* Index route for /police */}
      <Route index element={<Navigate to="login" replace />} />

      {/* Public Authentication Pages */}
      <Route path="register" element={<Registration />} />
      <Route path="login" element={<Login />} />
      <Route path="forgotpassword" element={<ForgotPassword />} />
      <Route path="otp" element={<OTP />} />

      {/* Protected Police Dashboard Routes */}
      <Route path="dashboard" element={<ProtectedRoute allowedRoles={["POLICE"]}><Dashboard /></ProtectedRoute>} />
      <Route path="recentcase" element={<ProtectedRoute allowedRoles={["POLICE"]}><RecentCases /></ProtectedRoute>} />
      <Route path="todayscase" element={<ProtectedRoute allowedRoles={["POLICE"]}><TodaysCase /></ProtectedRoute>} />
      <Route path="pendingcases" element={<ProtectedRoute allowedRoles={["POLICE"]}><PendingCases /></ProtectedRoute>} />
      <Route path="riskzone" element={<ProtectedRoute allowedRoles={["POLICE"]}><Riskzone /></ProtectedRoute>} />
      <Route path="sos-route" element={<ProtectedRoute allowedRoles={["POLICE"]}><PoliceSosRoute /></ProtectedRoute>} />

      {/* Future / Alias Pages */}
      <Route path="heatmap" element={<ProtectedRoute allowedRoles={["POLICE"]}><Dashboard /></ProtectedRoute>} />
      <Route path="riskprediction" element={<ProtectedRoute allowedRoles={["POLICE"]}><Dashboard /></ProtectedRoute>} />
      <Route path="officers" element={<ProtectedRoute allowedRoles={["POLICE"]}><Dashboard /></ProtectedRoute>} />
      <Route path="patrol" element={<ProtectedRoute allowedRoles={["POLICE"]}><Dashboard /></ProtectedRoute>} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}

export default Policeroute;