// client/src/pages/AdminCreateUserPage.jsx
import { useState, useEffect } from "react"; // ✅ Importación ÚNICA y limpia de hooks
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
  
  // 💡 ESTADO para las listas de opciones (Roles y Departamentos)
  const [roles, setRoles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  // --- Carga de Roles y Departamentos (al montar el componente) ---
  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setDataLoading(true);
      try {
        // Obtenemos los roles y departamentos que ya creaste en Django
        const [rolesRes, deptosRes] = await Promise.all([
          api.get("accounts/roles/"),
          api.get("accounts/departamentos/"),
        ]);
        
        if (cancelled) return;
        
        setRoles(rolesRes.data);
        setDepartamentos(deptosRes.data);

      } catch (e) {
        console.error("Error cargando opciones de rol/departamento:", e);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []); // El array vacío asegura que solo se ejecute una vez al inicio
  
  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para crear usuarios.
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: value === "" ? "" : value 
    }));
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
      
      // ✅ Enviamos el ID o NULL si no se seleccionó nada
      id_rol: form.id_rol || null,
      id_nomina: form.id_nomina || null,
      id_departamento: form.id_departamento || null,
    };

    setLoading(true);
    try {
      await api.post("auth/register/", payload); 
      setSuccess("Usuario creado correctamente ✅");
      setForm(initialForm);
    } catch (e) {
      console.error(e);
      const data = e?.response?.data;
      let detail = "No se pudo crear el usuario.";

      if (data) {
        detail = data.username?.[0] || data.correo?.[0] || data.detail || JSON.stringify(data);
      }
      
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dataLoading) {
    return <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>Cargando datos y opciones...</div>;
  }
  
  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: 8 }}>Crear usuario</h1>
      <p style={{ marginBottom: 24, color: "#4b5563" }}>
        Desde acá podés cargar manualmente un empleado.
      </p>

      {error && (
        <div style={{ marginBottom: 12, color: "#dc2626" }}>{error}</div>
      )}
      {success && (
        <div style={{ marginBottom: 12, color: "#16a34a" }}>{success}</div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {/* CAMPOS BÁSICOS (Mantenidos) */}
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

        <hr style={{ margin: "1.5rem 0" }} />
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#111827", marginBottom: "1rem" }}>Asignación</h2>
        
        {/* ✅ SELECTOR DE ROL */}
        <div className="auth-field">
          <label>Rol</label>
          <select
            className="auth-input"
            name="id_rol"
            value={form.id_rol}
            onChange={handleChange}
          >
            <option value="">Seleccionar Rol (Opcional)</option>
            {roles.map((rol) => (
              <option key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre_rol}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ SELECTOR DE DEPARTAMENTO */}
        <div className="auth-field">
          <label>Departamento</label>
          <select
            className="auth-input"
            name="id_departamento"
            value={form.id_departamento}
            onChange={handleChange}
          >
            <option value="">Seleccionar Departamento (Opcional)</option>
            {departamentos.map((depto) => (
              <option key={depto.id_departamento} value={depto.id_departamento}>
                {depto.nombre_area}
              </option>
            ))}
          </select>
        </div>

        {/* Campo ID NÓMINA (mantenido) */}
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