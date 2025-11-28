// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { loginApi } from "../api/auth.api";

// Helper para decodificar el payload del JWT
function decodeToken(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const jsonPayload = atob(payloadBase64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error decodificando token", e);
    return null;
  }
}

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Cuando arranca la app, leo el token del localStorage
  useEffect(() => {
    const access = localStorage.getItem("access");
    if (access) {
      const payload = decodeToken(access);
      if (payload) {
        setUser({
          username: payload.username,
          rol: payload.rol,
          isApproved: payload.is_approved,
          idUsuario: payload.id_usuario,
          isStaff: payload.is_staff,
          isSuperuser: payload.is_superuser,
        });
      }
    }
    setReady(true);
  }, []);

  // Login: llama al backend, guarda tokens y arma el user
  const login = async (username, password) => {
    const data = await loginApi({ username, password }); // { access, refresh }

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    const payload = decodeToken(data.access);
    const newUser = payload
      ? {
          username: payload.username,
          rol: payload.rol,
          isApproved: payload.is_approved,
          idUsuario: payload.id_usuario,
          isStaff: payload.is_staff,
          isSuperuser: payload.is_superuser,
        }
      : null;

    setUser(newUser);
    return newUser;
  };

  const signOut = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  const value = {
    user,
    authed: !!user,   // 👉 lo usa ProtectedRoute
    ready,            // 👉 lo usa ProtectedRoute
    login,            // 👉 lo usa LoginPage
    signOut,          // 👉 lo usa MePage
  };

  return (
    <AuthContext.Provider value={value}>
      {ready ? children : null}
    </AuthContext.Provider>
  );
}
