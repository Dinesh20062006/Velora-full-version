import axios from "axios";
import client from "./client";
import { getMyReports } from "./reportApi";

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
  return config;
});

// Helper for persistent read notification state in localStorage
const getReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem("velora_read_notification_ids") || "[]"));
  } catch {
    return new Set();
  }
};

const saveReadNotificationIds = (readSet) => {
  try {
    localStorage.setItem("velora_read_notification_ids", JSON.stringify(Array.from(readSet)));
  } catch {}
};

const isPoliceDispatch = (n) => {
  if (!n) return false;
  if (n.type === "DISPATCH") return true;
  if (n.id && String(n.id).startsWith("dispatch_")) return true;
  if (n.title && (n.title.toUpperCase().includes("POLICE PATROL") || n.title.toUpperCase().includes("PATROL DISPATCHED"))) return true;
  if (n.message && n.message.includes("Police Patrol Unit")) return true;
  return false;
};

let isNotificationsBackendAvailable = false;
let isComplaintsBackendAvailable = true;
let isSosBackendAvailable = false;

export const getNotifications = async (page = 0, size = 20) => {
  const mergedList = [];
  const seenIds = new Set();
  const readSet = getReadNotificationIds();

  const addNotification = (item) => {
    if (!item || !item.id || seenIds.has(String(item.id))) return;
    seenIds.add(String(item.id));

    // If ID is marked as read in localStorage, set read flag
    if (readSet.has(String(item.id))) {
      item.read = true;
    }

    mergedList.push(item);
  };

  // 1. Fetch Backend System Notifications from DB (Circuit-breaker protected)
  if (isNotificationsBackendAvailable) {
    try {
      const res = await client.get("/notifications", { params: { page, size } }).catch((err) => {
        if (err?.response?.status >= 500 || err?.code === "ERR_NETWORK" || err?.message?.includes("CORS")) {
          isNotificationsBackendAvailable = false;
        }
        return null;
      });
      if (res && res.data) {
        const data = Array.isArray(res.data) ? res.data : (res.data.content || []);
        data.forEach((n) => {
          if (n) {
            addNotification({
              id: String(n.id || n.notificationId || Math.random()),
              title: n.title || n.heading || "System Notification",
              message: n.message || n.body || n.content || "",
              type: n.type || "SYSTEM",
              read: Boolean(n.read || n.isRead),
              createdAt: n.createdAt || n.timestamp || new Date().toISOString()
            });
          }
        });
      }
    } catch {
      isNotificationsBackendAvailable = false;
    }
  }

  // 2. Fetch ALL Dynamic Incident Complaints from DB (Circuit-breaker protected)
  if (isComplaintsBackendAvailable) {
    const complaintPromises = [
      complaintClient.get("/api/complaints").then(r => r?.data).catch(() => null),
      getMyReports().then(r => r?.data).catch(() => null)
    ];

    try {
      const complaintResults = await Promise.allSettled(complaintPromises);
      let successCount = 0;
      complaintResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          successCount++;
          const raw = result.value;
          const list = Array.isArray(raw) ? raw : (raw?.content || raw?.data || []);
          if (Array.isArray(list)) {
            list.forEach((c) => {
              if (!c) return;
              const rawId = c.complaintId || c.id;
              if (!rawId) return;
              const notifId = String(rawId).startsWith("complaint_") ? String(rawId) : `complaint_${rawId}`;
              addNotification({
                id: notifId,
                title: `⚠️ Incident Report: ${c.title || c.category || "Safety Report"}`,
                message: `Category: ${c.category || "General"} | Location: ${c.location || "Recorded Location"} | Status: ${c.status || "PENDING"}`,
                type: "REPORT",
                read: Boolean(c.read),
                createdAt: c.createdAt || c.updatedAt || new Date().toISOString()
              });
            });
          }
        }
      });
      if (successCount === 0) {
        isComplaintsBackendAvailable = false;
      }
    } catch {
      isComplaintsBackendAvailable = false;
    }
  }

  // 3. Fetch ALL Dynamic SOS Alerts from DB (Circuit-breaker protected)
  if (isSosBackendAvailable) {
    const sosPromises = [
      client.get("/police/sos-alerts").then(r => r?.data).catch((err) => {
        if (err?.response?.status >= 500) isSosBackendAvailable = false;
        return null;
      }),
      client.get("/safety/incidents/my").then(r => r?.data).catch(() => null)
    ];

    try {
      const sosResults = await Promise.allSettled(sosPromises);
      sosResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          const raw = result.value;
          const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : (raw?.content || []));
          if (Array.isArray(list)) {
            list.forEach((s) => {
              if (!s) return;
              const rawId = s.id || s.sosId || s.incidentId;
              if (!rawId) return;
              const notifId = String(rawId).startsWith("sos_") ? String(rawId) : `sos_${rawId}`;
              const loc = typeof s.location === "object" ? s.location?.address : s.location;
              addNotification({
                id: notifId,
                title: "🚨 EMERGENCY SOS ALERT",
                message: `Victim: ${s.victimName || s.userName || "Citizen User"} | Location: ${loc || "Live GPS Signal"} | Status: ${s.status || "ACTIVE"}`,
                type: "ALERT",
                read: Boolean(s.read),
                createdAt: s.triggerTime || s.createdAt || s.updatedAt || new Date().toISOString()
              });
            });
          }
        }
      });
    } catch {
      // Fallback gracefully
    }
  }

  // 4. Fetch custom/local notifications if present
  try {
    const rawCustomNotifs = localStorage.getItem("velora_custom_notifications");
    if (rawCustomNotifs) {
      const customList = JSON.parse(rawCustomNotifs);
      if (Array.isArray(customList)) {
        customList.forEach(addNotification);
      }
    }
  } catch {}

  try {
    const rawLocalSos = localStorage.getItem("velora_sos_history");
    if (rawLocalSos) {
      const localSosList = JSON.parse(rawLocalSos);
      if (Array.isArray(localSosList)) {
        localSosList.forEach((s) => {
          if (!s) return;
          const rawId = s.id || s.timestamp;
          if (!rawId) return;
          const notifId = String(rawId).startsWith("local_sos_") ? String(rawId) : `local_sos_${rawId}`;
          addNotification({
            id: notifId,
            title: "🚨 EMERGENCY SOS Update",
            message: `Victim: ${s.victimName || "User"} | Status: ${s.status || "DISMISSED"} | Handled by Police Command Center`,
            type: "ALERT",
            read: false,
            createdAt: s.timestamp || s.createdAt || new Date().toISOString()
          });
        });
      }
    }
  } catch {}

  // Sort all notifications by timestamp descending (newest first)
  mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter out Police Patrol Dispatch notifications and raw internal SOS
  const userFiltered = mergedList.filter(n => n.type !== "SOS" && n.referenceType !== "SOS_ALERT" && !isPoliceDispatch(n));

  return { success: true, data: userFiltered };
};

export const getUnreadCount = async () => {
  try {
    const res = await getNotifications();
    const list = res.data || [];
    const unread = list.filter((n) => !n.read).length;
    return { success: true, data: unread };
  } catch {
    return { success: true, data: 0 };
  }
};

export const markNotificationRead = async (id) => {
  if (id) {
    const readSet = getReadNotificationIds();
    readSet.add(String(id));
    saveReadNotificationIds(readSet);

    try {
      const rawCustomNotifs = localStorage.getItem("velora_custom_notifications");
      if (rawCustomNotifs) {
        const customList = JSON.parse(rawCustomNotifs);
        if (Array.isArray(customList)) {
          const updated = customList.map((item) => String(item.id) === String(id) ? { ...item, read: true } : item);
          localStorage.setItem("velora_custom_notifications", JSON.stringify(updated));
        }
      }
    } catch {}

    window.dispatchEvent(new Event("notifications_updated"));
  }

  try {
    const r = await client.put(`/notifications/${id}/read`);
    return r.data;
  } catch {
    return { success: true };
  }
};

export const markAllNotificationsRead = async (ids = []) => {
  const readSet = getReadNotificationIds();

  if (Array.isArray(ids) && ids.length > 0) {
    ids.forEach((id) => readSet.add(String(id)));
  } else {
    try {
      const res = await getNotifications();
      (res.data || []).forEach((n) => {
        if (n.id) readSet.add(String(n.id));
      });
    } catch {}
  }
  saveReadNotificationIds(readSet);

  try {
    const rawCustomNotifs = localStorage.getItem("velora_custom_notifications");
    if (rawCustomNotifs) {
      const customList = JSON.parse(rawCustomNotifs);
      if (Array.isArray(customList)) {
        const updated = customList.map((item) => ({ ...item, read: true }));
        localStorage.setItem("velora_custom_notifications", JSON.stringify(updated));
      }
    }
  } catch {}

  window.dispatchEvent(new Event("notifications_updated"));

  try {
    const r = await client.put("/notifications/mark-all-read");
    return r.data;
  } catch {
    return { success: true };
  }
};

export const deleteNotification = (id) =>
  client.put(`/notifications/${id}/read`).then((r) => r.data).catch(() => ({ success: true }));
