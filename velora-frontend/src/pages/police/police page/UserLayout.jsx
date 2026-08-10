import { useState } from "react";
import TopNavbar from "./TopNavbar.jsx";
import Sidebar from "./Sidebar.jsx";
import "../police style/index.css";

function UserLayout({ children }) {
  const [collapse, setCollapse] = useState(false);

  return (
    <div className="user-layout" style={{ background: "#0b0f17", minHeight: "100vh", color: "#f3f4f6" }}>
      <TopNavbar />
      <div className="layout-body" style={{ display: "flex" }}>
        <Sidebar collapse={collapse} setCollapse={setCollapse} />
        <main className="layout-content" style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default UserLayout;