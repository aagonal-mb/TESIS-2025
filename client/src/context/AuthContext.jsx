import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { setTokens as setT, clearAuth as clearT } from "../api/api";

const Ctx = createContext(null);
export function useAuth(){ return useContext(Ctx); }

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    // 1 sola lectura inicial de localStorage
    const has = !!localStorage.getItem("access");
    setAuthed(has);
    setReady(true);

    // sincronizar entre pestañas
    const onStorage = (e) => {
      if (e.key === "access") setAuthed(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTokens = useCallback((tokens) => {
    setT(tokens);
    setAuthed(!!tokens?.access);
  }, []);

  const logout = useCallback(() => {
    clearT();
    setAuthed(false);
  }, []);

  return (
    <Ctx.Provider value={{ authed, ready, setTokens, logout }}>
      {children}
    </Ctx.Provider>
  );
}
