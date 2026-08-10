import client from "./client";
import { addAwardCredits, getCurrentUserKey } from "../utils/creditsManager";

const SUPPORT_QUERIES_KEY = "velora_support_queries";

export const getStoredQueries = (userKey) => {
  const activeKey = userKey || getCurrentUserKey();
  try {
    const raw = localStorage.getItem(SUPPORT_QUERIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.filter((q) => !q.userKey || String(q.userKey).toLowerCase() === String(activeKey).toLowerCase());
  } catch (e) {
    return [];
  }
};

export const submitSupportQuery = async (payload) => {
  const activeKey = getCurrentUserKey();
  const ticketId = `VLR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newQuery = {
    id: ticketId,
    ticketId: ticketId,
    userKey: activeKey,
    subject: payload.subject || "General Inquiry",
    category: payload.category || "General Support",
    message: payload.message || "",
    status: "OPEN",
    createdAt: new Date().toISOString()
  };

  // 1. Award +5 Award Credits for submitting query report
  addAwardCredits(5, activeKey);

  // 2. Save into persistent local storage database
  try {
    const raw = localStorage.getItem(SUPPORT_QUERIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(newQuery);
    localStorage.setItem(SUPPORT_QUERIES_KEY, JSON.stringify(list));
  } catch (e) {}

  // 3. Post to backend endpoint if available
  try {
    const res = await client.post("/support/query", { ...newQuery, ticketId });
    return { success: true, ticketId, data: res.data || newQuery };
  } catch (err) {
    return { success: true, ticketId, data: newQuery, isFallback: true };
  }
};

export const getMySupportQueries = async () => {
  const activeKey = getCurrentUserKey();
  const localQueries = getStoredQueries(activeKey);
  try {
    const res = await client.get("/support/queries");
    const backendQueries = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    const map = new Map();
    [...localQueries, ...backendQueries].forEach((q) => {
      if (q && (q.ticketId || q.id)) {
        map.set(String(q.ticketId || q.id), q);
      }
    });
    return Array.from(map.values());
  } catch (e) {
    return localQueries;
  }
};
