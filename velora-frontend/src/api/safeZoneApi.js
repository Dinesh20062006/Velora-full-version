import client from "./client";

export const getAllSafeZones = (page = 0, size = 20) =>
  client.get("/safety/safe-zones", { params: { page, size } }).then((r) => r.data);

export const getNearbySafeZones = (lat, lon, radius = 5000) =>
  client.get("/safety/safe-zones/nearby", { params: { lat, lon, radius } }).then((r) => r.data);

export const getNearbyEmergencyServices = (lat, lon, radius = 5000) =>
  client.get("/safety/emergency-services/nearby", { params: { lat, lon, radius } }).then((r) => r.data);

export const getSafeZoneById = (id) =>
  client.get(`/safety/safe-zones/${id}`).then((r) => r.data);
