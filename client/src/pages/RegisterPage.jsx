import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RegisterPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    nombre: "",
    apellido: "",
    correo: "",
    documento: "",
    id_rol: "",
    id_nomina: "",
    id_departamento: "",
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    // Armamos el payload para el serializer de Django
    const payload = {
      username: form.username,
      password: form.password,
      nombre: form.nombre,
      apellido: form.apellido,
      correo: form.correo,
      documento: form.documento,
      id_rol: form.id_rol ? Number(form.id_rol) : null,
      id_nomina: form.id_nomina ? Number(form.id_nomina) : null,
      id_departamento: form.id_departamento ? Number(form.id_departamento) : null,
    };

    try {
      await api.post("/auth/register/", payload);
      setSuccess("Tu cuenta fue creada. Queda pendiente de aprobación.");
      // Opcional: después de un ratito volvemos al login
      setTimeout(() => nav("/login"), 2000);
    } catch (e) {
      console.error(e);
      const data = e?.response?.data;
      // Tomamos mensajes del backend si vienen
      if (data) {
        const msgs = Object.values(data).flat().join(" ");
        setErr(msgs || "No se pudo registrar el usuario.");
      } else {
        setErr("No se pudo registrar el usuario.");
      }
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Crear cuenta</h1>

        <div className="auth-field">
          <label>Usuario</label>
          <input
            className="auth-input"
            name="username"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Contraseña</label>
          <input
            className="auth-input"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Nombre</label>
          <input
            className="auth-input"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Apellido</label>
          <input
            className="auth-input"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Correo</label>
          <input
            className="auth-input"
            type="email"
            name="correo"
            value={form.correo}
            onChange={handleChange}
          />
        </div>

        <div className="auth-field">
          <label>Documento (opcional)</label>
          <input
            className="auth-input"
            name="documento"
            value={form.documento}
            onChange={handleChange}
          />
        </div>

        {/* Campos de IDs para rol / nómina / depto (opcional, por ahora números) */}
        <div className="auth-field">
          <label>ID Rol (opcional)</label>
          <input
            className="auth-input"
            name="id_rol"
            value={form.id_rol}
            onChange={handleChange}
            placeholder="p. ej. 1"
          />
        </div>

        <div className="auth-field">
          <label>ID Nómina (opcional)</label>
          <input
            className="auth-input"
            name="id_nomina"
            value={form.id_nomina}
            onChange={handleChange}
            placeholder="p. ej. 1"
          />
        </div>

        <div className="auth-field">
          <label>ID Departamento (opcional)</label>
          <input
            className="auth-input"
            name="id_departamento"
            value={form.id_departamento}
            onChange={handleChange}
            placeholder="p. ej. 1"
          />
        </div>

        {err && <div className="auth-error">{err}</div>}
        {success && <div className="auth-success">{success}</div>}

        <button className="auth-btn" type="submit">
          Registrarme
        </button>

        <div className="auth-footer">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="auth-link">
            Volvé al login
          </Link>
        </div>
      </form>
    </div>
  );
}
