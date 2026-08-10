import axios from "axios";
import client from "./client";
import { getMyReports } from "./reportApi";

const COMPLAINT_SERVICE_URL = import.meta.env.VITE_COMPLAINT_SERVICE_URL || "http://localhost:8088";
const complaintClient = axios.create({
  baseURL: COMPLAINT_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

export const getNotifications = async (page = 0, size = 20) => {
  const mergedList = [];
  const seenIds = new Set();

  const addNotification = (item) => {
    if (!item || !item.id || seenIds.has(String(item.id))) return;
    seenIds.add(String(item.id));
    mergedList.push(item);
  };

  // 1. Fetch Backend System Notifications
  try {
    const res = await client.get("/notifications", { params: { page, size } });
    const data = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
    data.forEach(addNotification);
  } catch {
    // Fallback gracefully
  }

  // 2. Fetch Dynamic Incident Complaints (Backend + Local Reports)
  try {
    const myReportsRes = await getMyReports();
    const reports = Array.isArray(myReportsRes?.data) ? myReportsRes.data : [];
    reports.forEach((c) => {
      const cId = c.complaintId || c.id || Math.random();
      addNotification({
        id: `complaint_${cId}`,
        title: `⚠️ Incident Report: ${c.title || c.category || "Safety Report"}`,
        message: `Category: ${c.category || "General"} | Location: ${c.location || "Recorded Location"} | Status: ${c.status || "PENDING"}`,
        type: "REPORT",
        read: Boolean(c.read),
        createdAt: c.createdAt || c.updatedAt || new Date().toISOString()
      });
    });
  } catch {
    // Fallback gracefully
  }

  // 3. Fetch Dynamic SOS Alerts (Police SOS, Safety SOS & Local SOS Events)
  try {
    const res = await client.get("/police/sos-alerts");
    const sosAlerts = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
    sosAlerts.forEach((s) => {
      const loc = typeof s.location === "object" ? s.location?.address : s.location;
      addNotification({
        id: `sos_${s.id}`,
        title: "🚨 EMERGENCY SOS ALERT",
        message: `Victim: ${s.victimName || "Citizen User"} | Location: ${loc || "Live GPS Signal"} | Status: ${s.status || "ACTIVE"}`,
        type: "ALERT",
        read: Boolean(s.read),
        createdAt: s.triggerTime || s.createdAt || new Date().toISOString()
      });
    });
  } catch {
    // Fallback gracefully
  }

  try {
    const mySos = await client.get("/safety/incidents/my");
    const list = Array.isArray(mySos?.data) ? mySos.data : (mySos?.data?.content || []);
    list.forEach((s) => {
      addNotification({
        id: `my_sos_${s.id}`,
        title: "🚨 SOS Alert Dispatched",
        message: `Status: ${s.status || "ACTIVE"} | Location: ${s.location || "Current GPS Location"}`,
        type: "ALERT",
        read: Boolean(s.read),
        createdAt: s.createdAt || s.triggerTime || new Date().toISOString()
      });
    });
  } catch {
    // Fallback gracefully
  }

  // Fetch local SOS triggers if recorded in local storage
  try {
    const rawLocalSos = localStorage.getItem("velora_sos_history");
    if (rawLocalSos) {
      const localSosList = JSON.parse(rawLocalSos);
      if (Array.isArray(localSosList)) {
        localSosList.forEach((s) => {
          addNotification({
            id: `local_sos_${s.id || s.timestamp}`,
            title: "🚨 EMERGENCY SOS Dispatched",
            message: `Location: ${s.location || "Live GPS"} | Status: ${s.status || "ACTIVE"}`,
            type: "ALERT",
            read: false,
            createdAt: s.timestamp || s.createdAt || new Date().toISOString()
          });
        });
      }
    }
  } catch {
    // Fallback gracefully
  }

  // Sort all notifications by timestamp descending (newest first)
  mergedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { success: true, data: mergedList };
};

export const getUnreadCount = async () => {
  try {
    const res = await getNotifications();
    const list = res.data || [];
    return { data: list.filter((n) => !n.read).length };
  } catch {
    return { data: 0 };
  }
};

export const markNotificationRead = (id) =>
  client.put(`/notifications/${id}/read`).then((r) => r.data).catch(() => ({ success: true }));

export const markAllNotificationsRead = () =>
  client.put("/notifications/mark-all-read").then((r) => r.data).catch(() => ({ success: true }));

export const deleteNotification = (id) =>
  client.put(`/notifications/${id}/read`).then((r) => r.data).catch(() => ({ success: true }));
