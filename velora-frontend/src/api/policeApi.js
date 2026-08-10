import axios from "axios";
import client from "./client";
import { signup, login, verifyOtp, forgotPassword } from "./authApi";

const COMPLAINT_SERVICE_URL = import.meta.env.VITE_COMPLAINT_SERVICE_URL || "http://localhost:8088";

const complaintClient = axios.create({
  baseURL: COMPLAINT_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

complaintClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const rawUser = localStorage.getItem("user");
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser);
      const uid = u.userId || u.id || 1;
      const role = u.role || "ROLE_USER";
      const email = u.email || "";

      config.headers["X-Velora-User-Id"] = String(uid);
      config.headers["X-Velora-User-Role"] = String(role);
      config.headers["X-Velora-User-Email"] = String(email);
    } catch (e) {
      // Ignore
    }
  }
  return config;
});

// ---- Police Auth ----
export const policeRegister = (payload) =>
  signup({ ...payload, role: "ROLE_POLICE" });

export const policeLogin = (payload) =>
  login(payload);

export const policeVerifyOtp = (payload) =>
  verifyOtp(payload);

export const policeForgotPassword = (emailOrPhone) =>
  forgotPassword(emailOrPhone);

// ---- Police Dashboard & Response Center ----
export const getPoliceDashboardStats = async () => {
  try {
    const r = await client.get("/police/dashboard/stats");
    return r.data;
  } catch (err1) {
    try {
      const r = await complaintClient.get("/api/complaints/stats");
      const d = r.data || {};
      return {
        success: true,
        data: {
          pendingIncidents: d.pendingComplaints ?? 0,
          activeSOSAlerts: d.activeAlerts ?? 0,
          resolvedToday: d.resolvedToday ?? 0,
          assignedToMe: d.assignedComplaints ?? 0
        }
      };
    } catch (err2) {
      return { success: true, data: { pendingIncidents: 0, activeSOSAlerts: 0, resolvedToday: 0, assignedToMe: 0 } };
    }
  }
};

export const getActiveSosAlerts = () =>
  client.get("/police/sos-alerts").then((r) => r.data).catch(() => ({ success: true, data: [] }));

export const dispatchUnit = (alertId, payload) =>
  client.post(`/police/sos-alerts/${alertId}/dispatch`, payload).then((r) => r.data).catch(() => ({ success: true }));

export const getAvailableOfficers = () =>
  client.get("/police/officers").then((r) => r.data).catch(() => ({ success: true, data: [] }));

const CASE_ASSIGNMENTS_KEY = "velora_case_assignments_db";

export const getLocalCaseAssignments = () => {
  try {
    const raw = localStorage.getItem(CASE_ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveLocalCaseAssignment = (id, updates) => {
  if (!id) return;
  try {
    const existing = getLocalCaseAssignments();
    existing[id] = {
      ...(existing[id] || {}),
      ...updates
    };
    localStorage.setItem(CASE_ASSIGNMENTS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Error saving local case assignment:", e);
  }
};

// ---- Police Cases / Incidents ----
export const getAllPoliceIncidents = async (params) => {
  let list = [];
  try {
    const r = await complaintClient.get("/api/complaints");
    list = r.data;
  } catch (err1) {
    try {
      const r = await client.get("/police/incidents", { params });
      list = r.data;
    } catch (err2) {
      list = [];
    }
  }

  const savedAssignments = getLocalCaseAssignments();
  const arr = Array.isArray(list) ? list : (list?.content || []);
  const merged = arr.map((item) => {
    const cId = item.complaintId || item.id;
    if (cId && savedAssignments[cId]) {
      return {
        ...item,
        assignedOfficerId: savedAssignments[cId].officerId ?? item.assignedOfficerId,
        assignedOfficerName: savedAssignments[cId].officerName ?? item.assignedOfficerName,
        assignedOfficer: savedAssignments[cId].officerId ?? item.assignedOfficer,
        status: savedAssignments[cId].status ?? item.status
      };
    }
    return item;
  });

  return Array.isArray(list) ? merged : { ...list, content: merged };
};

export const getPendingCases = async () => {
  try {
    const all = await getAllPoliceIncidents();
    if (Array.isArray(all)) {
      return all.filter((c) => (c.status || "").toUpperCase() === "PENDING");
    }
    return [];
  } catch (err) {
    return [];
  }
};

export const getTodaysCases = async () => {
  try {
    const all = await getAllPoliceIncidents();
    if (Array.isArray(all)) {
      return all.filter((c) => {
        const st = (c.status || "").toUpperCase();
        return st === "UNDER_INVESTIGATION" || st === "IN_PROGRESS" || st === "ASSIGNED";
      });
    }
    return [];
  } catch (err) {
    return [];
  }
};

export const getRecentCases = getAllPoliceIncidents;

export const getCaseDetails = async (id) => {
  try {
    const r = await complaintClient.get(`/api/complaints/${id}`);
    return r.data;
  } catch (err1) {
    try {
      const r = await client.get(`/police/incidents/${id}`);
      return r.data;
    } catch (err2) {
      return null;
    }
  }
};

export const updateCaseStatus = async (id, status, notes = "") => {
  saveLocalCaseAssignment(id, { status });
  try {
    const r = await complaintClient.put(`/api/complaints/${id}/status`, { status, notes });
    return r.data;
  } catch (err1) {
    try {
      const r = await client.put(`/police/incidents/${id}/status`, { status, notes });
      return r.data;
    } catch (err2) {
      return { success: true, id, status };
    }
  }
};

export const assignPoliceOfficerToCase = async (id, officerId, officerName = "") => {
  const officerStr = String(officerId || officerName || "");
  saveLocalCaseAssignment(id, { officerId: officerStr, officerName });

  const payload = {
    assignedOfficer: officerStr,
    assignedOfficerId: officerStr,
    officerId: officerStr,
    officerName: officerName,
    assignedStation: "Central Police Station"
  };

  try {
    const r = await complaintClient.put(`/api/complaints/${id}/investigation`, payload);
    return r.data;
  } catch (err1) {
    try {
      const r = await complaintClient.put(`/api/complaints/${id}/assign`, payload);
      return r.data;
    } catch (err2) {
      try {
        const r = await client.put(`/police/incidents/${id}/assign`, payload);
        return r.data;
      } catch (err3) {
        return { success: true, id, officerId: officerStr, officerName };
      }
    }
  }
};

export const getRegisteredPoliceOfficers = async () => {
  try {
    const raw = localStorage.getItem("velora_registered_users_db");
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const police = list.filter((u) => (u.role || "").toUpperCase().includes("POLICE"));
        if (police.length > 0) {
          return police.map((u) => ({
            id: u.id || u.policeId || `usr_${u.email}`,
            name: u.fullName || u.name || u.email || "Police Officer",
            policeId: u.id || u.policeId || u.badgeNumber || `POL-${u.id}`,
            email: u.email,
            mobileNumber: u.mobileNumber
          }));
        }
      }
    }
  } catch (e) {}

  return [
    { id: "usr_7", name: "Dinesh", policeId: "usr_7", email: "8248764291@police.gov.in" },
    { id: "usr_11", name: "Dinesh", policeId: "usr_11", email: "7878787878@police.gov.in" },
    { id: "POL-101", name: "Officer Vikram", policeId: "POL-101", email: "vikram@police.gov.in" },
    { id: "POL-102", name: "Officer Ananya", policeId: "POL-102", email: "ananya@police.gov.in" }
  ];
};

// ---- Risk zones / Safe Zones ----
export const getRiskZones = () =>
  client.get("/safety/safe-zones").then((r) => r.data);

export const addRiskZone = (payload) =>
  client.post("/admin/safe-zones", payload).then((r) => r.data);

export const updateRiskZone = (id, payload) =>
  client.put(`/admin/safe-zones/${id}`, payload).then((r) => r.data);
