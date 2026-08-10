
import UserLayout from "../../../layouts/UserLayout";
import { useNavigate } from "react-router-dom";

import logo from "../../../assets/logos/velora-trans.png";
import BackButton from "../../../common/BackButton/BackButton";

import {
    FiMoon,
    FiGlobe,
    FiHelpCircle,
    FiChevronRight
} from "react-icons/fi";

function ProfileSettings() {

    const navigate = useNavigate();

    return (

        <UserLayout>
<BackButton />
            <div className="settings-page">

                <div className="settings-header">

                  

                    <h1>Settings</h1>

                </div>

                <div className="settings-card app-card">

                    <img
                        src={logo}
                        alt="Velora"
                        className="app-logo"
                    />

                    <div>

                        <h2>VELORA</h2>

                        <p>Version 2.4.1 • Up to date</p>

                    </div>

                </div>

                <h3 className="section-title">

                    Preferences

                </h3>

                <div className="settings-card">

                    <div className="setting-item">

                        <div className="setting-left">

                            <FiMoon className="setting-icon"/>

                            <span>Dark Mode</span>

                        </div>

                        <button className="toggle-btn">

                            ON

                        </button>

                    </div>

                    <div className="setting-item">

                        <div className="setting-left">

                            <FiGlobe className="setting-icon"/>

                            <span>Language</span>

                        </div>

                        <span className="setting-value">

                            English

                        </span>

                    </div>

                </div>

                <h3 className="section-title">

                    Support

                </h3>

                <div className="settings-card" onClick={()=>navigate("/support")}>

                    <div className="setting-item">

                        <div className="setting-left">

                            <FiHelpCircle className="setting-icon"/>

                            <span>Help & FAQ</span>

                        </div>

                        <FiChevronRight className="arrow"/>

                    </div>

                    

                   

                </div>

            </div>

        </UserLayout>

    );

}

export default ProfileSettings;