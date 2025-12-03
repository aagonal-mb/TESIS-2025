// client/src/components/SurveysList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

// Nota: No se importa SurveyCard porque el componente se auto-renderiza en la lista.

export function SurveysList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin =
    (user?.rol && user.rol.toLowerCase() === "admin") ||
    user?.is_superuser ||
    user?.isStaff;

  // Criterios de filtrado del usuario actual (del token JWT)
  const currentAuthId = user?.id_usuario; // Asumo que el assigned_user usa el ID del Usuario de Negocio
  const currentRolName = user?.rol;
  const currentDeptoName = user?.departamento;

  useEffect(() => {
    loadSurveys();
  }, [isAdmin]); // Recargar si el estado de admin cambia

  async function loadSurveys() {
    setErr("");
    setLoading(true);
    try {
      // Obtenemos todas las encuestas. El SurveySerializer de Django incluye el campo 'assignments'.
      const res = await api.get("surveys/surveys/");
      setSurveys(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las encuestas.");
    } finally {
      setLoading(false);
    }
  }

  // --- Lógica Central de Filtrado de Visibilidad (Asignación) ---
  const isAssignedToUser = (survey) => {
    // 1. ADMINS ven todas las encuestas
    if (isAdmin) return true;

    // 2. Si la encuesta está inactiva, no se muestra a nadie que no sea admin
    if (!survey.status) {
      return false;
    }

    // 3. CASO: Encuesta NO ASIGNADA (o asignaciones es un array vacío)
    // Si no hay asignaciones, se asume que es PÚBLICA para usuarios autenticados, 
    // siempre y cuando su status sea TRUE.
    if (!survey.assignments || survey.assignments.length === 0) {
        return true; 
    }

    // 4. CASO: Encuesta ASIGNADA (Filtrar por asignaciones)
    return survey.assignments.some(assignment => {
        // Asignación por Usuario Individual
        if (assignment.assigned_user === currentAuthId) {
            return true;
        }

        // Asignación por Rol (compara el nombre del Rol)
        if (assignment.assigned_rol_data?.nombre_rol === currentRolName) {
            return true;
        }

        // Asignación por Departamento (compara el nombre del Área/Departamento)
        if (assignment.assigned_departamento_data?.nombre_area === currentDeptoName) {
            return true;
        }

        return false;
    });
  };
  
  async function handleDeleteSurvey(id) {
    // ... (Lógica de eliminación mantenida)
    const confirmation = window.confirm(
      "¿Seguro que querés eliminar esta encuesta? Esta acción no se puede deshacer."
    );
    if (!confirmation) return;

    try {
      await api.delete(`surveys/surveys/${id}/`);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la encuesta.");
    }
  }

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-AR");
    } catch {
      return iso;
    }
  };

  // 1. Aplicar filtro de visibilidad (asignación)
  const visibleSurveys = surveys.filter(isAssignedToUser);
  
  // 2. Aplicar filtro de búsqueda
  const filtered = visibleSurveys.filter((s) => {
    const text = `${s.title || ""} ${s.description || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            margin: 0,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Encuestas
        </h1>

        {isAdmin && (
          <button
            type="button"
            className="auth-btn"
            style={{ maxWidth: 200 }}
            onClick={() => navigate("/surveys/new")}
          >
            + Nueva encuesta
          </button>
        )}
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="auth-input"
          style={{ maxWidth: 320 }}
          placeholder="Buscar por título o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div>Cargando encuestas...</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 8 }}>{err}</div>}

      {!loading && !err && filtered.length === 0 && (
        <div>
          No se encontraron encuestas {isAdmin ? 'creadas' : 'asignadas'} con ese criterio.
        </div>
      )}

      {/* LISTA */}
      {!loading &&
        !err &&
        filtered.length > 0 &&
        filtered.map((s) => (
          <div
            key={s.id}
            style={{
              borderRadius: 12,
              padding: 16,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
            onClick={() => navigate(`/surveys/${s.id}`)}
          >
            <div>
              {/* TÍTULO */}
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {s.title || "Encuesta sin título"}
              </div>

              {s.description && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    color: "#6b7280",
                  }}
                >
                  {s.description}
                </div>
              )}

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                Creada el {formatDate(s.created_at)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {/* Botón Ver Encuesta */}
              <button
                type="button"
                style={{
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  padding: "6px 12px",
                  fontSize: 12,
                  background: "#ffffff",
                  color: "#111827",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/surveys/${s.id}`);
                }}
              >
                Ver encuesta
              </button>

              {isAdmin && (
                <button
                  type="button"
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 12px",
                    fontSize: 12,
                    background: "#ef4444",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSurvey(s.id);
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}