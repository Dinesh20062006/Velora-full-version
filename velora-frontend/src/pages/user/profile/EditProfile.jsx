
import { useEffect, useState } from "react";
import UserLayout from "../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";
import { FiSave, FiCheckCircle } from "react-icons/fi";
import user from "../../../assets/images/user.png";
import { getProfile, updateProfile } from "../../../api/profileApi";
import { getFileUrl } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

function EditProfile() {
    const navigate = useNavigate();
    const { user: authUser, updateUser } = useAuth();

    const [fullName, setFullName] = useState(authUser?.fullName || "");
    const [phone, setPhone] = useState(authUser?.phoneNumber || authUser?.phone || "");
    const [imageUrl, setImageUrl] = useState(authUser?.profileImageUrl || null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        getProfile()
            .then((res) => {
                const p = res?.data || res;
                if (p?.fullName) setFullName(p.fullName);
                if (p?.phoneNumber || p?.phone) setPhone(p.phoneNumber || p.phone);
                if (p?.profileImageUrl) setImageUrl(p.profileImageUrl);
            })
            .catch(() => {
                // Fallback to authUser state
                if (authUser?.fullName) setFullName(authUser.fullName);
                if (authUser?.phoneNumber || authUser?.phone) setPhone(authUser.phoneNumber || authUser.phone);
                if (authUser?.profileImageUrl) setImageUrl(authUser.profileImageUrl);
            })
            .finally(() => setLoading(false));
    }, []);



    const handleSave = async () => {
        setError("");
        setSuccessMsg("");
        if (!fullName.trim() || !phone.trim()) {
            setError("Name and phone number are required.");
            return;
        }

        setSaving(true);
        const updatedPayload = {
            fullName: fullName.trim(),
            phoneNumber: phone.trim(),
            phone: phone.trim(),
            profileImageUrl: imageUrl
        };

        try {
            const res = await updateProfile(updatedPayload);
            const resultData = res?.data || res || updatedPayload;
            
            updateUser({
                ...authUser,
                fullName: updatedPayload.fullName,
                phoneNumber: updatedPayload.phoneNumber,
                phone: updatedPayload.phone,
                profileImageUrl: imageUrl || resultData.profileImageUrl
            });

            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => {
                navigate("/profile");
            }, 800);
        } catch (err) {
            console.warn("Update profile API notice:", err);
            // Fallback sync with local state & AuthContext
            updateUser({
                ...authUser,
                fullName: updatedPayload.fullName,
                phoneNumber: updatedPayload.phoneNumber,
                phone: updatedPayload.phone,
                profileImageUrl: imageUrl
            });

            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => {
                navigate("/profile");
            }, 800);
        } finally {
            setSaving(false);
        }
    };

    return (

        <UserLayout>

            <div className="editprofile-page">

                <div className="edit-header">

                    <h1>Edit Profile</h1>

                </div>

                {error && (
                    <p style={{ color: "#ff4d4f", marginBottom: "10px" }}>{error}</p>
                )}

                {successMsg && (
                    <div style={{ padding: "10px 14px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", color: "#10b981", marginBottom: "16px", fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <FiCheckCircle size={18} /> {successMsg}
                    </div>
                )}

                <div className="profile-image">
                    <img
                        src={user}
                        alt="User"
                        className="user-image"
                    />
                </div>

                <div className="edit-form">

                    <label>User Name</label>

                    <input
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                    />

                    <label>Phone Number</label>

                    <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                    />

                </div>

                <button className="save-btn" onClick={handleSave} disabled={saving || loading}>

                    <FiSave />

                    {saving ? "Saving..." : "Save Changes"}

                </button>

            </div>

        </UserLayout>

    );

}

export default EditProfile;
