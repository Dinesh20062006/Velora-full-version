import client from "./client";

export const getDashboard = async (lat, lng) => {
  try {
    const res = await client.get("/safety/dashboard", { params: { lat, lng } });
    return res.data;
  } catch {
    try {
      const res = await client.get("/police/dashboard/stats");
      return res.data;
    } catch {
      return {
        safetyScore: 85,
        status: "SAFE",
        activeAlerts: 0,
        nearbyOfficers: 4,
        safeZonesCount: 12
      };
    }
  }
};
