import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!email.trim()) {
      setErr("Ingresá un correo válido.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email });
      setMsg(
        "Si el correo está registrado, vas a recibir un email con instrucciones."
      );
    } catch (e) {
      console.error(e);
      // Igual no mostramos detalle para no revelar info
      setMsg(
        "Si el correo está registrado, vas a recibir un email con instrucciones."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Ingresá tu correo y te enviaremos un enlace para restablecerla.
        </p>

        {err && <div className="auth-error">{err}</div>}
        {msg && <div className="auth-success">{msg}</div>}

        <div className="auth-field">
          <label>Correo</label>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@empresa.com"
          />
        </div>

        <button className="auth-btn" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>

        <div className="auth-footer">
          ¿Te acordaste?{" "}
          <Link to="/login" className="auth-link">
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
