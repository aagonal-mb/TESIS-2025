// client/src/api/auth.api.js
import apiClient from "./apiClient";

// 👉 Login: pide token JWT
export async function loginApi({ username, password }) {
  const res = await apiClient.post("/api/auth/token/", {
    username,
    password,
  });
  return res.data; // { access, refresh }
}

// 👉 Registro: crea User + Usuario en backend
// Mantengo el nombre que tu front ya usaba: "register"
export async function register(payload) {
  // payload: { username, password, nombre, apellido, correo, documento, ... }
  const res = await apiClient.post("/api/auth/register/", payload);
  return res.data; // devuelve el Usuario creado
}

// Alias opcional por si en algún lado usamos registerApi
export const registerApi = register;
