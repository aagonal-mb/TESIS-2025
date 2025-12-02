// client/src/components/SurveysList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

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

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("surveys/surveys/");
      setSurveys(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las encuestas.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSurvey(id) {
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

  const filtered = surveys.filter((s) => {
    const text = `${s.title || ""} ${s.description || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
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
        <div>No se encontraron encuestas con ese criterio.</div>
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
              {/* TÍTULO BIEN MARCADO */}
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
