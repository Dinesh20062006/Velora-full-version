
import { useEffect, useRef, useState } from "react";
import UserLayout from "../../../layouts/UserLayout";

import { useNavigate } from "react-router-dom";

import { FiCamera, FiSave } from "react-icons/fi";

import user from "../../../assets/images/user.png";
import { getProfile, updateProfile, uploadProfileImage } from "../../../api/profileApi";
import { getFileUrl } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

function EditProfile() {

    const navigate = useNavigate();
    const { user: authUser, updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getProfile()
            .then((res) => {
                const p = res?.data;
                setFullName(p?.fullName || "");
                setPhone(p?.phoneNumber || p?.phone || "");
                setImageUrl(p?.profileImageUrl || null);
            })
            .catch(() => {
                setFullName(authUser?.fullName || "");
                setPhone(authUser?.phoneNumber || authUser?.phone || "");
            })
            .finally(() => setLoading(false));
    }, []);

    const handlePhotoClick = () => fileInputRef.current?.click();

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setError("");
        try {
            const res = await uploadProfileImage(file);
            setImageUrl(res?.data?.profileImageUrl || null);
            updateUser({ profileImageUrl: res?.data?.profileImageUrl });
        } catch (err) {
            setError(err?.response?.data?.message || "Could not upload photo.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setError("");
        if (!fullName.trim() || !phone.trim()) {
            setError("Name and phone number are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await updateProfile({ fullName: fullName.trim(), phoneNumber: phone.trim(), phone: phone.trim(), profileImageUrl: imageUrl });
            updateUser(res?.data || { fullName: fullName.trim(), phoneNumber: phone.trim(), phone: phone.trim(), profileImageUrl: imageUrl });
            navigate("/profile");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not save changes.");
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

                <div className="profile-image">

                    <img
                        src={imageUrl ? getFileUrl(imageUrl) : user}
                        alt="User"
                        className="user-image"
                    />

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handlePhotoChange}
                    />

                    <button className="change-photo" onClick={handlePhotoClick} disabled={uploading}>

                        <FiCamera />

                        {uploading ? "Uploading..." : "Change Photo"}

                    </button>

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
