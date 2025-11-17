import { useState } from "react";
import api, { setTokens } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { setTokens: setCtxTokens } = useAuth?.() || {};
  const [username, setUser] = useState("");
  const [password, setPass] = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e){
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      // Endpoint estándar de JWT
      const { data } = await api.post("/auth/token/", { username, password });
      // Guardar tokens (en tu helper y en el contexto si lo usás)
      setTokens({ access: data.access, refresh: data.refresh });
      if (setCtxTokens) setCtxTokens({ access: data.access, refresh: data.refresh });
      window.location.href = "/";
    } catch (e) {
      // Mostrar mensaje real
      const detail = e?.response?.data?.detail;
      setErr(detail || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Iniciar sesión</h1>
        <div className="auth-field">
          <label>Usuario</label>
          <input className="auth-input" value={username} onChange={e=>setUser(e.target.value)} />
        </div>
        <div className="auth-field">
          <label>Contraseña</label>
          <input className="auth-input" type="password" value={password} onChange={e=>setPass(e.target.value)} />
        </div>
        {err && <div className="auth-error">{err}</div>}
        <button className="auth-btn" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  );
}
