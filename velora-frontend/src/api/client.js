import axios from "axios";

// Default base URL for Spring Cloud API Gateway: http://localhost:8080/api/v1
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token and user headers to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const rawUser = localStorage.getItem("user");
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser);
      const uid = u.userId || u.id || 1;
      const role = u.role || "ROLE_USER";
      const email = u.email || "";

      config.headers["X-Velora-User-Id"] = String(uid);
      config.headers["X-Velora-User-Role"] = String(role);
      config.headers["X-Velora-User-Email"] = String(email);

      config.headers["X-User-Id"] = String(uid);
      config.headers["X-User-Role"] = String(role);
      config.headers["X-User-Email"] = String(email);
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePending(token) {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectPending(error) {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

// On 401, try to refresh the access token once, then retry the original request.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        return Promise.reject(error);
      }


      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const authData = data.data || data;
        const newAccessToken = authData.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        if (authData.refreshToken) {
          localStorage.setItem("refreshToken", authData.refreshToken);
        }
        resolvePending(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        rejectPending(refreshError);
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

const FILE_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");

export function getFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${FILE_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function saveSession(authResponseData) {
  // Support both ApiResponse wrapper { success, message, data } and direct object
  const data = authResponseData?.data || authResponseData;
  if (!data) return;

  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

  const user = data.user || {
    id: data.userId || data.id,
    userId: data.userId || data.id,
    email: data.email,
    fullName: data.fullName,
    role: data.role || "ROLE_USER"
  };

  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export default client;

