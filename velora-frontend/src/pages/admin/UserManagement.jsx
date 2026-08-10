import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getAllUsers, updateUserStatus, addAdminUser, deleteAdminUser } from "../../api/adminApi";
import { IoPersonAddOutline, IoCloseOutline, IoTrashOutline } from "react-icons/io5";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    role: "ROLE_USER"
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res?.data || []);
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";
    try {
      await updateUserStatus(id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
      );
    } catch (e) {
      alert("Failed to update user account status");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently remove/delete ${name} (${id})?`)) {
      return;
    }
    try {
      const res = await deleteAdminUser(id);
      if (res?.users) {
        setUsers(res.users);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (e) {
      alert("Could not remove user");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert("Please enter Full Name and Email");
      return;
    }
    setSubmitting(true);
    try {
      const res = await addAdminUser(formData);
      if (res?.users) {
        setUsers(res.users);
      } else {
        fetchUsers();
      }
      setShowModal(false);
      setFormData({ fullName: "", email: "", mobileNumber: "", role: "ROLE_USER" });
    } catch (err) {
      alert("Could not add user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="casePage" style={{ paddingBottom: "40px" }}>
        <div className="top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ color: "#f9fafb", margin: 0 }}>User & Officer Management</h1>
            <p style={{ color: "#9ca3af", margin: "4px 0 0 0" }}>Manage platform registered citizens, police officers, and administrators</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: "#00E676",
              color: "#000000",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 12px rgba(0,230,118,0.3)"
            }}
          >
            <IoPersonAddOutline style={{ fontSize: "18px" }} /> + Add User / Officer
          </button>
        </div>

        <div className="tableBox" style={{ background: "#1f2937", padding: "20px", borderRadius: "12px", border: "1px solid #374151", marginTop: "20px" }}>
          <h2 style={{ color: "#f3f4f6", marginBottom: "16px" }}>Registered User Accounts ({users.length})</h2>
          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading users from database...</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", color: "#d1d5db", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #374151" }}>
                  <th style={{ padding: "12px" }}>USER ID</th>
                  <th style={{ padding: "12px" }}>FULL NAME</th>
                  <th style={{ padding: "12px" }}>EMAIL / CONTACT</th>
                  <th style={{ padding: "12px" }}>ASSIGNED ROLE</th>
                  <th style={{ padding: "12px" }}>ACCOUNT STATUS</th>
                  <th style={{ padding: "12px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #27272a" }}>
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
                          onClick={() => handleDeleteUser(u.id, u.fullName)}
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

        {/* Modal for Adding New User/Officer */}
        {showModal && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}>
            <div style={{
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "14px",
              padding: "28px",
              width: "100%",
              maxWidth: "460px",
              color: "#ffffff"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Add User / Officer Account</h2>
                <IoCloseOutline onClick={() => setShowModal(false)} style={{ fontSize: "24px", cursor: "pointer", color: "#9ca3af" }} />
              </div>

              <form onSubmit={handleAddUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#111827", border: "1px solid #374151", color: "#fff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="officer@police.gov.in or user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#111827", border: "1px solid #374151", color: "#fff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>Contact Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#111827", border: "1px solid #374151", color: "#fff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>Assigned Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#111827", border: "1px solid #374151", color: "#fff" }}
                  >
                    <option value="ROLE_USER">ROLE_USER (Citizen)</option>
                    <option value="ROLE_POLICE">ROLE_POLICE (Police Officer)</option>
                    <option value="ROLE_ADMIN">ROLE_ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #374151", background: "#111827", color: "#fff", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "none", background: "#00E676", color: "#000000", fontWeight: "bold", cursor: "pointer" }}
                  >
                    {submitting ? "Saving..." : "Add Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
