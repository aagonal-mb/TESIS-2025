// client/src/pages/UsersAdminPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function UsersAdminPage() {
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  // MODO EDICIÓN GLOBAL
  const [editMode, setEditMode] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [draftDept, setDraftDept] = useState({}); // { [id_usuario]: id_departamento }
  const [draftRol, setDraftRol] = useState({}); // { [id_usuario]: id_rol }

  const isAdmin =
    (user?.rol && user.rol.toLowerCase() === "admin") ||
    user?.is_superuser ||
    user?.isStaff;

  useEffect(() => {
    if (!isAdmin) return;
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadInitialData() {
    setErr("");
    setLoading(true);
    try {
      const [usersRes, deptRes, rolesRes] = await Promise.all([
        api.get("accounts/usuarios/"),
        api.get("accounts/departamentos/"), // ajustá si tu endpoint se llama distinto
        api.get("accounts/roles/"),         // idem
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      setUsuarios(users);
      setDepartamentos(Array.isArray(deptRes.data) ? deptRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);

      // si estamos en modo edición, refrescamos los borradores
      if (editMode) {
        const newDraftDept = {};
        const newDraftRol = {};
        users.forEach((u) => {
          newDraftDept[u.id_usuario] =
            u.id_departamento_data?.id ?? u.id_departamento ?? "";
          newDraftRol[u.id_usuario] = u.id_rol_data?.id ?? u.id_rol ?? "";
        });
        setDraftDept(newDraftDept);
        setDraftRol(newDraftRol);
      }
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(u) {
    setBusyId(u.id_usuario);
    setErr("");
    try {
      await api.post(`accounts/usuarios/${u.id_usuario}/approve/`);
      await loadInitialData();
    } catch (e) {
      console.error(e);
      setErr("Error al aprobar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(u) {
    setBusyId(u.id_usuario);
    setErr("");
    try {
      const isActive = u.user?.is_active;
      const url = isActive
        ? `accounts/usuarios/${u.id_usuario}/deactivate/`
        : `accounts/usuarios/${u.id_usuario}/reactivate/`;
      await api.post(url);
      await loadInitialData();
    } catch (e) {
      console.error(e);
      setErr("Error al cambiar el estado del usuario.");
    } finally {
      setBusyId(null);
    }
  }

  // ----- MODO EDICIÓN GLOBAL -----

  function enterEditMode() {
    const newDraftDept = {};
    const newDraftRol = {};
    usuarios.forEach((u) => {
      newDraftDept[u.id_usuario] =
        u.id_departamento_data?.id ?? u.id_departamento ?? "";
      newDraftRol[u.id_usuario] = u.id_rol_data?.id ?? u.id_rol ?? "";
    });
    setDraftDept(newDraftDept);
    setDraftRol(newDraftRol);
    setEditMode(true);
    setErr("");
  }

  function cancelEditMode() {
    setEditMode(false);
    setDraftDept({});
    setDraftRol({});
    setSavingBulk(false);
    setErr("");
  }

  async function saveBulkChanges() {
    setSavingBulk(true);
    setErr("");

    try {
      const requests = [];

      usuarios.forEach((u) => {
        const originalDeptId =
          u.id_departamento_data?.id ?? u.id_departamento ?? "";
        const originalRolId = u.id_rol_data?.id ?? u.id_rol ?? "";

        const newDeptId = draftDept[u.id_usuario] ?? "";
        const newRolId = draftRol[u.id_usuario] ?? "";

        // solo enviamos PATCH si cambió algo
        if (String(originalDeptId) !== String(newDeptId) ||
            String(originalRolId) !== String(newRolId)) {
          requests.push(
            api.patch(
              `accounts/usuarios/${u.id_usuario}/update-role-dept/`,
              {
                id_departamento: newDeptId || null,
                id_rol: newRolId || null,
              }
            )
          );
        }
      });

      if (requests.length > 0) {
        await Promise.all(requests);
      }

      await loadInitialData();
      setEditMode(false);
      setDraftDept({});
      setDraftRol({});
    } catch (e) {
      console.error(e);
      setErr("No se pudieron guardar los cambios de rol y departamento.");
    } finally {
      setSavingBulk(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver esta página.
      </div>
    );
  }

  const filtered = usuarios.filter((u) => {
    const text =
      `${u.nombre || ""} ${u.apellido || ""} ${u.correo || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* HEADER + CONTROLES */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              margin: 0,
              fontWeight: 700,
            }}
          >
            Gestión de usuarios
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            Administración de cuentas, roles y departamentos.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="auth-input"
            style={{ maxWidth: 260 }}
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {!editMode && (
            <button
              type="button"
              onClick={enterEditMode}
              style={{
                border: "none",
                background: "#4f46e5",
                color: "#ffffff",
                cursor: "pointer",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 13,
                whiteSpace: "nowrap",
              }}
            >
              Editar roles y departamentos
            </button>
          )}

          {editMode && (
            <>
              <button
                type="button"
                onClick={saveBulkChanges}
                disabled={savingBulk}
                style={{
                  border: "none",
                  background: "#16a34a",
                  color: "#ffffff",
                  cursor: "pointer",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {savingBulk ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={cancelEditMode}
                disabled={savingBulk}
                style={{
                  border: "none",
                  background: "#e5e7eb",
                  color: "#111827",
                  cursor: "pointer",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div>Cargando usuarios...</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 8 }}>{err}</div>}

      {!loading && filtered.length === 0 && (
        <div>No se encontraron usuarios con ese criterio.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Correo</th>
                <th style={thStyle}>Departamento</th>
                <th style={thStyle}>Rol</th>
                <th style={thStyle}>Aprobado</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const fullName = `${u.nombre || ""} ${
                  u.apellido || ""
                }`.trim();
                const deptName =
                  u.id_departamento_data?.nombre_departamento || "-";
                const rolName = u.id_rol_data?.nombre_rol || "-";
                const aprobado = u.is_approved ? "Sí" : "No";
                const activo = u.user?.is_active ? "Activo" : "Inactivo";

                const deptValue = draftDept[u.id_usuario] ?? "";
                const rolValue = draftRol[u.id_usuario] ?? "";

                return (
                  <tr
                    key={u.id_usuario}
                    style={{ borderTop: "1px solid #e5e7eb" }}
                  >
                    <td style={tdStyle}>{u.id_usuario}</td>
                    <td style={tdStyle}>{fullName || "-"}</td>
                    <td style={tdStyle}>{u.correo}</td>

                    {/* DEPARTAMENTO */}
                    <td style={tdStyle}>
                      {editMode ? (
                        <select
                          value={deptValue}
                          onChange={(e) =>
                            setDraftDept((prev) => ({
                              ...prev,
                              [u.id_usuario]: e.target.value,
                            }))
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                          }}
                        >
                          <option value="">Sin departamento</option>
                          {departamentos.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre_departamento}
                            </option>
                          ))}
                        </select>
                      ) : (
                        deptName
                      )}
                    </td>

                    {/* ROL */}
                    <td style={tdStyle}>
                      {editMode ? (
                        <select
                          value={rolValue}
                          onChange={(e) =>
                            setDraftRol((prev) => ({
                              ...prev,
                              [u.id_usuario]: e.target.value,
                            }))
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                          }}
                        >
                          <option value="">Sin rol</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre_rol}
                            </option>
                          ))}
                        </select>
                      ) : (
                        rolName
                      )}
                    </td>

                    <td style={tdStyle}>{aprobado}</td>
                    <td style={tdStyle}>{activo}</td>

                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {!u.is_approved && (
                          <button
                            type="button"
                            onClick={() => handleApprove(u)}
                            disabled={busyId === u.id_usuario || editMode}
                            style={btnSecondary}
                          >
                            {busyId === u.id_usuario
                              ? "Aprobando..."
                              : "Aprobar"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={busyId === u.id_usuario || editMode}
                          style={btnPrimary}
                        >
                          {busyId === u.id_usuario
                            ? "Actualizando..."
                            : u.user?.is_active
                            ? "Desactivar"
                            : "Reactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#6b7280",
  fontWeight: 600,
};

const tdStyle = {
  padding: "10px 16px",
  fontSize: 14,
  color: "#111827",
};

const btnPrimary = {
  border: "none",
  background: "#4f46e5",
  color: "#ffffff",
  cursor: "pointer",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 12,
};

const btnSecondary = {
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  cursor: "pointer",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 12,
};
