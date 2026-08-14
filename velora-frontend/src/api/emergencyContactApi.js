import client from "./client";

const LOCAL_STORAGE_KEY = "velora_emergency_contacts";

const getLocalContacts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveLocalContacts = (contacts) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
  } catch {}
};

export const getEmergencyContacts = async () => {
  try {
    const res = await client.get("/users/emergency-contacts");
    const data = Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
    if (data && data.length > 0) {
      saveLocalContacts(data);
      return data;
    }
  } catch (err) {
    console.warn("Get emergency contacts backend fallback:", err.message);
  }

  const local = getLocalContacts();
  if (local && Array.isArray(local) && local.length > 0) {
    return local;
  }

  const defaultContacts = [
    { id: 1, name: "National Emergency Helpline", phone: "112", relation: "Helpline", isPrimary: true },
    { id: 2, name: "Police Control Room", phone: "100", relation: "Police", isPrimary: true }
  ];
  saveLocalContacts(defaultContacts);
  return defaultContacts;
};

export const addEmergencyContact = async (payload) => {
  const body = {
    name: payload.name,
    phoneNumber: payload.phoneNumber || payload.phone,
    relationship: payload.relationship || payload.relation || "Emergency Contact",
    email: payload.email || "",
    primary: payload.primary || payload.isPrimary || false
  };

  let newContact = null;
  try {
    const res = await client.post("/users/emergency-contacts", body);
    newContact = res.data;
  } catch (err) {
    console.warn("Add emergency contact backend fallback:", err.message);
    newContact = {
      id: Date.now(),
      name: body.name,
      phone: body.phoneNumber,
      phoneNumber: body.phoneNumber,
      relation: body.relationship,
      relationship: body.relationship,
      primary: body.primary,
      isPrimary: body.primary
    };
  }

  const current = (await getEmergencyContacts()) || [];
  const updatedList = [...current, newContact];
  saveLocalContacts(updatedList);

  return newContact;
};

export const updateEmergencyContact = async (id, payload) => {
  const body = {
    id,
    name: payload.name,
    phoneNumber: payload.phoneNumber || payload.phone,
    relationship: payload.relationship || payload.relation || "Emergency Contact",
    email: payload.email || "",
    primary: payload.primary || payload.isPrimary || false
  };

  let updatedContact = null;
  try {
    const res = await client.put(`/users/emergency-contacts/${id}`, body);
    updatedContact = res.data;
  } catch (err) {
    console.warn("Update emergency contact backend fallback:", err.message);
    updatedContact = {
      id,
      name: body.name,
      phone: body.phoneNumber,
      phoneNumber: body.phoneNumber,
      relation: body.relationship,
      relationship: body.relationship,
      primary: body.primary,
      isPrimary: body.primary
    };
  }

  const current = getLocalContacts() || [];
  const updatedList = current.map((c) => (String(c.id) === String(id) ? { ...c, ...updatedContact } : c));
  saveLocalContacts(updatedList);

  return updatedContact;
};

export const deleteEmergencyContact = async (id) => {
  try {
    await client.delete(`/users/emergency-contacts/${id}`);
  } catch (err) {
    console.warn("Delete emergency contact backend fallback:", err.message);
  }

  const current = getLocalContacts() || [];
  const updatedList = current.filter((c) => String(c.id) !== String(id));
  saveLocalContacts(updatedList);

  return { success: true, id };
};
