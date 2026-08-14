import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAllUsers, updateUserStatus, deleteAdminUser } from "../../api/adminApi";
import { IoTrashOutline } from "react-icons/io5";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res?.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!cancelled) {
        await fetchUsers();
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    try {
      await updateUserStatus(id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update user account status");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user account?")) {
      return;
    }
    try {
      const res = await deleteAdminUser(id);
      if (res?.users) {
        setUsers(res.users);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Could not remove user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const role = (u.role || "").toUpperCase();
    if (roleFilter !== "ALL" && !role.includes(roleFilter)) return false;

    const status = (u.status || "ACTIVE").toUpperCase();
    if (statusFilter !== "ALL" && status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (u.fullName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.mobileNumber || u.phone || "").toLowerCase();
      const id = String(u.id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="casePage" style={{ paddingBottom: "40px" }}>
        <div className="top">
          <div>
            <h1 style={{ color: "#f9fafb", margin: 0 }}>User & Officer Management</h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0" }}>Manage platform registered citizens, police officers, and administrators</p>
          </div>
        </div>

        <div className="tableBox" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <h2 style={{ color: "#f3f4f6", margin: 0 }}>Registered User Accounts ({filteredUsers.length})</h2>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="🔍 Search User Name, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#111827",
                border: "1px solid #374151",
                color: "#f3f4f6",
                fontSize: "14px",
                outline: "none",
                minWidth: "260px"
              }}
            />
          </div>

          {/* Filter Bar Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", padding: "12px 0 16px 0", borderTop: "1px solid #374151", borderBottom: "1px solid #374151", marginBottom: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>Filter By:</span>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#111827", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">👤 All Roles</option>
              <option value="ADMIN">💖 ADMIN</option>
              <option value="POLICE">👮 POLICE</option>
              <option value="USER">👥 USER</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", background: "#111827", border: "1px solid #374151", color: "#f3f4f6", fontSize: "13px", cursor: "pointer" }}
            >
              <option value="ALL">📌 All Statuses</option>
              <option value="ACTIVE">🟢 Active Accounts</option>
              <option value="DEACTIVATED">🔴 Deactivated Accounts</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading users from database...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No user accounts matching filter criteria.</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", color: "#d1d5db", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #374151" }}>
                  <th style={{ padding: "12px" }}>S.NO</th>
                  <th style={{ padding: "12px" }}>USER ID</th>
                  <th style={{ padding: "12px" }}>FULL NAME</th>
                  <th style={{ padding: "12px" }}>EMAIL / CONTACT</th>
                  <th style={{ padding: "12px" }}>ASSIGNED ROLE</th>
                  <th style={{ padding: "12px" }}>ACCOUNT STATUS</th>
                  <th style={{ padding: "12px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #27272a" }}>
                    <td style={{ padding: "12px", color: "#9ca3af", fontWeight: "600" }}>{index + 1}</td>
                    <td style={{ padding: "12px", color: "#9ca3af", fontWeight: "500" }}>{u.id}</td>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "#ffffff" }}>{u.fullName}</td>
                    <td style={{ padding: "12px" }}>
                      <div>{u.email}</div>
                      <small style={{ color: "#9ca3af" }}>{u.mobileNumber || u.phone || "—"}</small>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: u.role === "ROLE_ADMIN" ? "#ec4899" : u.role === "ROLE_POLICE" ? "#3b82f6" : "#00E676",
                        color: u.role === "ROLE_USER" ? "#000000" : "#ffffff"
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: u.status === "ACTIVE" ? "#00E676" : "#ef4444", fontWeight: "bold" }}>
                        ● {u.status || "ACTIVE"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u.id, u.status || "ACTIVE")}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            background: u.status === "ACTIVE" ? "#f59e0b" : "#00E676",
                            color: u.status === "ACTIVE" ? "#000000" : "#000000",
                            fontWeight: "bold",
                            fontSize: "12px",
                            transition: "all 0.2s"
                          }}
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            background: "#ef4444",
                            color: "#ffffff",
                            fontWeight: "bold",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s"
                          }}
                        >
                          <IoTrashOutline style={{ fontSize: "14px" }} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
