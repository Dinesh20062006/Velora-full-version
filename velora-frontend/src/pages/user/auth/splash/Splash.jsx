import React from 'react'
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../../assets/images/splash-background.png";
function Splash() {
     const navigate = useNavigate();
  useEffect(() => {const timer = setTimeout(() => {navigate("/onboarding1");}, 2000);return () => clearTimeout(timer);}, [navigate]);
  return (
    <div className="splash">
        <div className="splash-content">
        <img src={logo} alt="Velora Logo" className="logo" />
         <h1>Velora</h1>
        <p>Empowering Safety<br/> Through AI </p>
        </div>
    </div>
  )
}
export default Splash
