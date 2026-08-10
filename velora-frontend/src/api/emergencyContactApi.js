import client from "./client";

export const getEmergencyContacts = async () => {
  try {
    const res = await client.get("/users/emergency-contacts");
    return res.data;
  } catch (err) {
    console.warn("Get emergency contacts fallback:", err.message);
    return [
      { id: 1, name: "National Emergency Helpline", phone: "112", relation: "Helpline", isPrimary: true },
      { id: 2, name: "Police Control Room", phone: "100", relation: "Police", isPrimary: true }
    ];
  }
};

export const addEmergencyContact = async (payload) => {
  try {
    const body = {
      name: payload.name,
      phoneNumber: payload.phoneNumber || payload.phone,
      relationship: payload.relationship || payload.relation || "Emergency Contact",
      email: payload.email || "",
      primary: payload.primary || payload.isPrimary || false
    };
    const res = await client.post("/users/emergency-contacts", body);
    return res.data;
  } catch (err) {
    console.warn("Add emergency contact fallback:", err.message);
    return { id: Date.now(), ...payload };
  }
};

export const updateEmergencyContact = async (id, payload) => {
  try {
    const body = {
      name: payload.name,
      phoneNumber: payload.phoneNumber || payload.phone,
      relationship: payload.relationship || payload.relation || "Emergency Contact",
      email: payload.email || "",
      primary: payload.primary || payload.isPrimary || false
    };
    const res = await client.put(`/users/emergency-contacts/${id}`, body);
    return res.data;
  } catch (err) {
    console.warn("Update emergency contact fallback:", err.message);
    return { id, ...payload };
  }
};

export const deleteEmergencyContact = async (id) => {
  try {
    const res = await client.delete(`/users/emergency-contacts/${id}`);
    return res.data;
  } catch (err) {
    console.warn("Delete emergency contact fallback:", err.message);
    return { success: true, id };
  }
};
