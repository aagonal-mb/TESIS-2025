// client/src/api/accounts.api.js (NUEVAS FUNCIONES)
import api from "./api";

// ... (otras funciones existentes)

export const getRoles = () => api.get("accounts/roles/");
export const getDepartamentos = () => api.get("accounts/departamentos/");

// Para la asignación individual, necesitamos una lista de usuarios
// Asumo que tienes una ruta para listar usuarios (ej: /accounts/usuarios/)
export const getUsersList = () => api.get("accounts/usuarios/");