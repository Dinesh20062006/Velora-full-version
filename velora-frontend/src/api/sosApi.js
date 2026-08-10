import client from "./client";

export const triggerSos = (payload) =>
  client.post("/safety/sos", payload).then((r) => r.data);

export const cancelSos = (id, payload) =>
  client.post(`/safety/sos/${id}/cancel`, payload).then((r) => r.data);

export const resolveSos = (id, payload) =>
  client.post(`/safety/sos/${id}/cancel`, payload).then((r) => r.data);

export const getSosHistory = () =>
  client.get("/safety/incidents/my").then((r) => r.data);
