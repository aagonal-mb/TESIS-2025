// client/src/api/auth.api.js
import api from "./api";

// POST /api/accounts/register/
export function register({ username, email, password }) {
  return api.post("/accounts/register/", { username, email, password });
}

// POST /api/accounts/login/  → guarda tokens (ya refresca el interceptor)
export async function login({ username, password }) {
  const { data } = await api.post("/accounts/login/", { username, password });
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

// GET /api/accounts/me/
export function me() {
  return api.get("/accounts/me/");
}

// POST /api/accounts/logout/
export async function logout() {
  const refresh = localStorage.getItem("refresh");
  await api.post("/accounts/logout/", { refresh });
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}
