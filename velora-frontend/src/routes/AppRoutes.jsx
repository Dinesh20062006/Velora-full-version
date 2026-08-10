import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Splash from "../pages/user/auth/splash/Splash";
import Onboarding1 from "../pages/user/auth/onboarding/Onboarding1";
import Onboarding2 from "../pages/user/auth/onboarding/Onboarding2";
import Onboarding3 from "../pages/user/auth/onboarding/Onboarding3";
import Login from "../pages/user/auth/login/Login";
import Signup from "../pages/user/auth/signup/Signup";
import OTP from "../pages/user/auth/otp/OTP";
import ForgotPassword from "../pages/user/auth/forgotPassword/ForgotPassword";
import EmergencyContactSetup from "../pages/user/auth/emergencyContactSetup/EmergencyContactSetup";
import AddEmergencyContact from "../pages/user/auth/addEmergencyContact/AddEmergencyContact";
import EmergencyContacts from "../pages/user/auth/emergencycontacts/EmergencyContacts";

import Dashboard from "../pages/user/dashboard/dashboard/Dashboard";

import SOS from "../pages/user/emergency/sos/SOS";
import EmergencyAlert from "../pages/user/emergency/emergencyalert/EmergencyAlert";

import ReportIncident from "../pages/user/report/reportincident/ReportIncident";
import UploadEvidence from "../pages/user/report/uploadevidence/UploadEvidence";
import ReportSuccess from "../pages/user/report/reportsuccess/ReportSuccess";

import SafeRoute from "../pages/user/route/saferoute/SafeRoute";
import RouteDetails from "../pages/user/route/routedetails/RouteDetails";
import Navigation from "../pages/user/route/navigation/Navigation";

import SafeZones from "../pages/user/safezones/safezones/SafeZones";
import SafeZoneDetails from "../pages/user/safezones/safezonedetails/SafeZoneDetails";

import AIAssistant from "../pages/user/ai/aiassistant/AIAssistant";
import SafetyAnalysis from "../pages/user/ai/safetyanalysis/SafetyAnalysis";

import Notification from "../pages/user/notification/Notification";
import EditProfile from "../pages/user/profile/EditProfile";
import PrivacySettings from "../pages/user/profile/PrivacySettings";
import ProfilePage from "../pages/user/profile/ProfilePage";
import ProfileSettings from "../pages/user/profile/ProfileSettings";
import Support from "../pages/user/profile/Support";
import QuerySubmitted from "../pages/user/profile/QuerySubmitted";
import Policeroute from "../pages/police/policeroute/Policeroute";

// Admin Module Imports
import AdminLogin from "../pages/admin/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UserManagement from "../pages/admin/UserManagement";
import SafeZoneManagement from "../pages/admin/SafeZoneManagement";
import SystemHealth from "../pages/admin/SystemHealth";
import AuditLogs from "../pages/admin/AuditLogs";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Splash />} />
                
                {/* Police Module Routes */}
                <Route path="/police/*" element={<Policeroute />} />

                {/* Admin Module Routes - Accessible ONLY to ADMIN users */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/safezones" element={<ProtectedRoute allowedRoles={["ADMIN"]}><SafeZoneManagement /></ProtectedRoute>} />
                <Route path="/admin/health" element={<ProtectedRoute allowedRoles={["ADMIN"]}><SystemHealth /></ProtectedRoute>} />
                <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditLogs /></ProtectedRoute>} />

                {/* User Module Auth Routes */}
                <Route path="/onboarding1" element={<Onboarding1 />} />
                <Route path="/onboarding2" element={<Onboarding2 />} />
                <Route path="/onboarding3" element={<Onboarding3 />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/otp" element={<OTP />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/emergency-contact-setup" element={<EmergencyContactSetup />}/>
                <Route path="/emergency-contacts" element={<EmergencyContacts />} />
                <Route path="/add-emergency-contact"  element={<AddEmergencyContact />} />

                {/* User Dashboard & Feature Routes */}
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/sos" element={<SOS />} />
                <Route path="/emergency-alert" element={<EmergencyAlert />} />

                <Route path="/report" element={<ReportIncident />} />
                <Route path="/report-incident" element={<ReportIncident />} />
                <Route path="/upload-evidence" element={<UploadEvidence />} />
                <Route path="/report-success" element={<ReportSuccess />} />

                <Route path="/safe-route" element={<SafeRoute />} />
                <Route path="/route-details" element={<RouteDetails />} />
                <Route path="/navigate" element={<Navigation />} />
                
                <Route path="/safe-zones" element={<SafeZones />} />
                <Route path="/safe-zone-details" element={<SafeZoneDetails />} />

                <Route path="/ai" element={<AIAssistant />} />
                <Route path="/ai-analysis" element={<SafetyAnalysis />} />

                <Route path="/notification" element={<Notification />} />

                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/privacy" element={<PrivacySettings />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/support" element={<Support />} />
                <Route path="/query-submitted" element={<QuerySubmitted />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;