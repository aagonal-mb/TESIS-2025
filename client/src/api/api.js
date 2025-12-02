// client/src/api/api.js
import axios from "axios";

export const BASE = "http://127.0.0.1:8000/api";

// instancia base para TODAS las llamadas a /api/...
const api = axios.create({
  baseURL: `${BASE}/`,
});

// helpers para tokens en localStorage
export function getAccess() {
  return localStorage.getItem("access");
}
export function getRefresh() {
  return localStorage.getItem("refresh");
}
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("access", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearAuth() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

// 👉 interceptor de REQUEST: agrega el access token si existe
api.interceptors.request.use(
  (config) => {
    const access = getAccess();
    if (access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 👉 lógica de refresh para cuando vence el access
let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefresh();
  if (!refresh) {
    throw new Error("No hay refresh token");
  }

  const res = await api.post("auth/token/refresh/", { refresh });
  const newAccess = res.data?.access;
  if (!newAccess) {
    throw new Error("No se pudo refrescar el token");
  }

  setTokens({ access: newAccess });
  return newAccess;
}

// 👉 interceptor de RESPONSE: si viene 401, intenta refrescar una vez
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};

    const status = error?.response?.status;
    const isAuthUrl =
      original.url &&
      (original.url.includes("auth/token") ||
        original.url.includes("auth/register"));

    // si es 401 y no es un endpoint de auth y no reintentamos todavía
    if (status === 401 && !original._retry && !isAuthUrl) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken().finally(() => {
            isRefreshing = false;
          });
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

    return Promise.reject(error);
  }
);

// ⬇️ IMPORTANTE: export default
export default api;
