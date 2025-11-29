// client/src/pages/AdminCreateUserPage.jsx
import { useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const initialForm = {
  username: "",
  password: "",
  nombre: "",
  apellido: "",
  correo: "",
  documento: "",
  id_rol: "",
  id_nomina: "",
  id_departamento: "",
};

export default function AdminCreateUserPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para crear usuarios.
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.username || !form.password || !form.nombre || !form.correo) {
      setError("Usuario, contraseña, nombre y correo son obligatorios.");
      return;
    }

    const payload = {
      username: form.username,
      password: form.password,
      nombre: form.nombre,
      apellido: form.apellido,
      correo: form.correo,
      documento: form.documento || "",
      id_rol: form.id_rol || null,
      id_nomina: form.id_nomina || null,
      id_departamento: form.id_departamento || null,
      // Si tu serializer lo acepta, esto lo deja aprobado de una:
      // is_approved: true,
    };

    setLoading(true);
    try {
      await api.post("auth/register/", payload);
      setSuccess("Usuario creado correctamente ✅");
      setForm(initialForm);
    } catch (e) {
      console.error(e);
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.username?.[0] ||
        e?.response?.data?.correo?.[0];
      setError(detail || "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Crear usuario</h1>
      <p style={{ marginBottom: 24, color: "#4b5563" }}>
        Desde acá podés cargar manualmente un empleado sin que pase
        por el formulario público de registro.
      </p>

      {error && (
        <div style={{ marginBottom: 12, color: "#dc2626" }}>{error}</div>
      )}
      {success && (
        <div style={{ marginBottom: 12, color: "#16a34a" }}>{success}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
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

        <button
          className="auth-btn"
          type="submit"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </form>
    </div>
  );
}
