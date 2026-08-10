
import { useEffect, useState } from "react";
import UserLayout from "../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";

import user from "../../../assets/images/user.png";

import { getProfile } from "../../../api/profileApi";
import { getEmergencyContacts } from "../../../api/emergencyContactApi";
import { getMyReports } from "../../../api/reportApi";
import { getFileUrl } from "../../../api/client";
import { useAuth } from "../../../context/AuthContext";

import {
    FiUser,
    FiShield,
    FiSettings,
    FiChevronRight
} from "react-icons/fi";

import { getAwardCredits } from "../../../utils/creditsManager";

function ProfilePage() {

    const navigate = useNavigate();
    const { user: authUser } = useAuth();

    const [profile, setProfile] = useState(authUser);
    const [awardCredits, setAwardCredits] = useState(0);
    const [contactsCount, setContactsCount] = useState(0);
    const [reportsCount, setReportsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadAll() {
            const userKey = authUser?.userId || authUser?.id || authUser?.email || profile?.id || profile?.email;
            setAwardCredits(getAwardCredits(userKey));

            const results = await Promise.allSettled([
                getProfile(),
                getEmergencyContacts(),
                getMyReports(userKey)
            ]);

            if (cancelled) return;

            const [profileRes, contactsRes, reportsRes] = results;

            if (profileRes.status === "fulfilled" && profileRes.value?.data) {
                setProfile(profileRes.value.data);
            }

            if (contactsRes.status === "fulfilled") {
                const val = contactsRes.value;
                const list = Array.isArray(val) ? val : (val?.data || val?.content || []);
                setContactsCount(list.length);
            }

            if (reportsRes.status === "fulfilled") {
                const val = reportsRes.value;
                const list = Array.isArray(val?.data) ? val.data : (Array.isArray(val) ? val : (val?.content || []));
                setReportsCount(list.length);
            }

            setLoading(false);
        }

        loadAll();
        return () => { cancelled = true; };
    }, [authUser, profile]);

    return (

        <UserLayout>

            <div className="profile-page">

                <h1 className="profile-title">
                    My Profile
                </h1>

                <div className="user-info">

                    <img
                        src={user}
                        alt="User"
                        className="user-img"
                    />

                    <h2>{profile?.fullName || authUser?.fullName || "Dinesh S"}</h2>

                    <p>
                        {profile?.phoneNumber || profile?.phone || authUser?.phone || profile?.email || authUser?.email || "dineshfreak2129@gmail.com"}
                    </p>

                </div>

                <div className="stats">

                    <div className="stat-card">

                        <h2 style={{ color: "#00E676" }}>{loading ? "—" : awardCredits}</h2>

                        <p>Award Credits</p>

                    </div>

                    <div className="stat-card">

                        <h2>{loading ? "—" : contactsCount}</h2>

                        <p>Contacts</p>

                    </div>

                    <div className="stat-card">

                        <h2>{loading ? "—" : reportsCount}</h2>

                        <p>Reports</p>

                    </div>

                </div>

                <h3 className="section-title">

                    Account

                </h3>

                <div className="menu-box">

                    <div className="menu-item" onClick={()=>navigate("/edit-profile")}>

                        <div className="menu-left">

                            <FiUser className="menu-icon"/>

                            <span>Edit Profile</span>

                        </div>

                        <FiChevronRight/>

                    </div>

                    <div className="menu-item" onClick={()=>navigate("/privacy")}>

                        <div className="menu-left">

                            <FiShield className="menu-icon"/>

                            <span>Privacy Settings</span>

                        </div>

                        <FiChevronRight/>

                    </div>

                    <div className="menu-item" onClick={()=>navigate("/profile-settings")}>

                        <div className="menu-left">

                            <FiSettings className="menu-icon"/>

                            <span>App Settings</span>
                            
                        </div>

                        <FiChevronRight/>

                    </div>

                </div>

               

            </div>
       
        </UserLayout>

    );

}

export default ProfilePage;
