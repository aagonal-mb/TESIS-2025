// client/src/pages/UsersAdminPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function UsersAdminPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      try {
        const res = await apiClient.get("/api/accounts/usuarios/");
        setUsuarios(res.data);
      } catch (e) {
        console.error(e);
        setErr("No se pudo cargar la lista de usuarios.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const aprobar = async (id_usuario) => {
    try {
      await apiClient.post(`/api/accounts/usuarios/${id_usuario}/approve/`);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === id_usuario ? { ...u, is_approved: true } : u
        )
      );
    } catch (e) {
      console.error(e);
      alert("Error al aprobar usuario");
    }
  };

  const isAdmin = user?.isSuperuser || user?.is_superuser || user?.rol === "admin";

  if (!isAdmin) {
    return (
      <div className="admin-users">
        <p className="admin-users__error">
          No tenés permisos para ver esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <header className="admin-users__header">
        <h1>Gestión de usuarios</h1>
        <p>Desde acá podés ver y aprobar cuentas de empleados.</p>
      </header>

      {loading && <p>Cargando usuarios...</p>}
      {err && <p className="admin-users__error">{err}</p>}

      {!loading && !usuarios.length && <p>No hay usuarios cargados.</p>}

      {!loading && usuarios.length > 0 && (
        <div className="admin-users__card">
          <table className="admin-users__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Aprobado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id_usuario}>
                  <td>{u.id_usuario}</td>
                  <td>
                    {u.nombre} {u.apellido}
                  </td>
                  <td>{u.correo}</td>
                  <td>{u.id_rol_data?.nombre_rol || "-"}</td>
                  <td>
                    {u.is_approved ? (
                      <span className="badge badge--ok">Sí</span>
                    ) : (
                      <span className="badge badge--pending">No</span>
                    )}
                  </td>
                  <td>
                    {!u.is_approved && (
                      <button
                        className="btn-approve"
                        onClick={() => aprobar(u.id_usuario)}
                      >
                        Aprobar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
