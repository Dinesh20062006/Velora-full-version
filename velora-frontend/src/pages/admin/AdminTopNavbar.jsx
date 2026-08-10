import velora_logo from '/src/assets/image/velora-trans.png';

function AdminTopNavbar() {
  return (
    <nav className="top-navbar" style={{ background: "#111827", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f2937" }}>
      <div className="nav-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img src={velora_logo} alt="Velora Logo" className="top-logo" style={{ height: "36px" }} />
        <span style={{ color: "#ec4899", fontWeight: "bold", fontSize: "18px" }}>VELORA ADMIN CONTROL</span>
      </div>

      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>System Administrator</span>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} title="System Healthy" />
      </div>
    </nav>
  );
}

export default AdminTopNavbar;
