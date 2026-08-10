import client from "./client";

export const getSafeRoute = (payload) =>
  client.post("/ai/safe-route", payload).then((r) => r.data);

export const analyzeRoute = (payload) =>
  client.post("/ai/safe-route", payload).then((r) => r.data);
