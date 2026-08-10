import React, { useState } from "react";
import AdminTopNavbar from "./AdminTopNavbar";
import AdminSidebar from "./AdminSidebar";
import "../police/police style/index.css";

function AdminLayout({ children }) {
  const [collapse, setCollapse] = useState(false);

  return (
    <div className="user-layout" style={{ background: "#0b0f17", minHeight: "100vh", color: "#f3f4f6" }}>
      <AdminTopNavbar />
      <div className="layout-body" style={{ display: "flex" }}>
        <AdminSidebar collapse={collapse} setCollapse={setCollapse} />
        <main className="layout-content" style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
