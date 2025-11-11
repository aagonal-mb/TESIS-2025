// client/src/api/api.js
import axios from "axios";

export const BASE = "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL: BASE });

// helpers para tokens en localStorage
function getAccess()  { return localStorage.getItem("access"); }
function getRefresh() { return localStorage.getItem("refresh"); }

api.interceptors.request.use((config) => {
  const token = getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = getRefresh();
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
          localStorage.setItem("access", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          clearAuth();
          window.location.href = "/login";
        }
      } else {
        clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export function setTokens({ access, refresh }) {
  if (access)  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}
export function isAuthed() { return !!getAccess(); }
