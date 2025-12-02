import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const invalidLink = !uid || !token;

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (invalidLink) {
      setErr("El enlace de recuperación no es válido.");
      return;
    }

    if (!pass1 || pass1.length < 6) {
      setErr("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (pass1 !== pass2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset-confirm/", {
        uid,
        token,
        new_password: pass1,
      });
      setMsg("Tu contraseña fue actualizada correctamente.");
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      setErr(detail || "No se pudo actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Restablecer contraseña</h1>

        {invalidLink && (
          <div className="auth-error">
            El enlace de recuperación no es válido o está incompleto.
          </div>
        )}

        {err && <div className="auth-error">{err}</div>}
        {msg && <div className="auth-success">{msg}</div>}

        {!invalidLink && (
          <>
            <div className="auth-field">
              <label>Nueva contraseña</label>
              <input
                className="auth-input"
                type="password"
                value={pass1}
                onChange={(e) => setPass1(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label>Repetir contraseña</label>
              <input
                className="auth-input"
                type="password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
              />
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </>
        )}

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
