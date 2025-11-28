import axios from "axios";

export const BASE = "http://127.0.0.1:8000/api";

// instancia base para TODAS las llamadas
const api = axios.create({ baseURL: "http://127.0.0.1:8000/api/" });

// helpers para tokens en localStorage
export function getAccess()  { return localStorage.getItem("access"); }
export function getRefresh() { return localStorage.getItem("refresh"); }
export function setTokens({ access, refresh }) {
  if (access)  localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}
export function isAuthed() { return !!getAccess(); }

// Adjunta ACCESS si existe
api.interceptors.request.use((config) => {
  const token = getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor con “candado” para refrescar sólo una vez
let refreshPromise = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (original._retry) {
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = getRefresh();
    if (!refresh) {
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${BASE}/auth/refresh/`, { refresh })
          .then(({ data }) => {
            localStorage.setItem("access", data.access);
            return data.access;
          })
          .finally(() => { refreshPromise = null; });
      }
      const newAccess = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      clearAuth();
      window.location.href = "/login";
      return Promise.reject(e);
    }
  }
);

// ⬇️ IMPORTANTE: export default
export default api;
