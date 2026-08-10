import client from "./client";

export const getProfile = () =>
  client.get("/users/profile").then((r) => r.data);

export const updateProfile = (payload) =>
  client.put("/users/profile", payload).then((r) => r.data);

export const uploadProfileImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return client
    .post("/users/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

export const changePassword = (payload) =>
  client.post("/auth/reset-password", payload).then((r) => r.data);

const PRIVACY_SETTINGS_KEY = "velora_privacy_settings";

export const getPrivacySettings = async () => {
  try {
    const res = await client.get("/users/profile");
    if (res?.data) {
      return {
        success: true,
        data: {
          locationSharingEnabled: res.data.locationSharingEnabled ?? true,
          shareWithContacts: res.data.locationSharingEnabled ?? true,
          anonymousReportingDefault: res.data.privacyModeEnabled ?? false
        }
      };
    }
  } catch {
    /* ignore fallback error */
  }

  try {
    const raw = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (raw) {
      return { success: true, data: JSON.parse(raw) };
    }
  } catch {
    /* ignore local storage error */
  }

  return {
    success: true,
    data: {
      locationSharingEnabled: true,
      shareWithContacts: true,
      anonymousReportingDefault: false
    }
  };
};

export const updatePrivacySettings = async (payload) => {
  try {
    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(payload));
  } catch {
    /* ignore local storage error */
  }

  try {
    const body = {
      locationSharingEnabled: payload.locationSharingEnabled,
      privacyModeEnabled: payload.anonymousReportingDefault
    };
    await client.put("/users/profile", body);
    return { success: true, data: payload };
  } catch {
    return { success: true, data: payload };
  }
};
