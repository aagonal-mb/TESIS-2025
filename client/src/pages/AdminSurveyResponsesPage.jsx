// client/src/pages/AdminSurveyResponsesPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminSurveyResponsesPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver esta página.
      </div>
    );
  }

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [surveysRes, questionsRes, answersRes] = await Promise.all([
          api.get("surveys/surveys/"),
          api.get("surveys/questions/"),
          api.get("surveys/answers/"),
        ]);

        const surveys = Array.isArray(surveysRes.data) ? surveysRes.data : [];
        const questions = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : [];
        const answers = Array.isArray(answersRes.data) ? answersRes.data : [];

        // Mapeo survey -> [ids de preguntas]
        const questionsBySurvey = questions.reduce((acc, q) => {
          const sid = q.survey;
          if (!acc[sid]) acc[sid] = [];
          acc[sid].push(q.id);
          return acc;
        }, {});

        const computedRows = surveys.map((sv) => {
          const qIds = questionsBySurvey[sv.id] || [];
          const ansForSurvey = answers.filter((a) => qIds.includes(a.question));
          const uniqueUsers = new Set(ansForSurvey.map((a) => a.user));

          return {
            id: sv.id,
            title: sv.title,
            createdAt: sv.created_at,
            answersCount: ansForSurvey.length,
            respondentsCount: uniqueUsers.size,
          };
        });

        // Ordenar por fecha descendente (las más nuevas arriba)
        computedRows.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt) : 0;
          const db = b.createdAt ? new Date(b.createdAt) : 0;
          return db - da;
        });

        setRows(computedRows);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar las encuestas respondidas.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = rows.filter((r) =>
    (r.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-AR");
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Encuestas respondidas</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            Visualizá y analizá las encuestas que ya tienen respuestas.
          </p>
        </div>

        <button
          className="auth-btn"
          type="button"
          style={{ maxWidth: 140 }}
          onClick={() => alert("Más adelante podés hacer un export a Excel/CSV acá 😉")}
        >
          Exportar
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <input
          className="auth-input"
          style={{ maxWidth: 260 }}
          placeholder="Buscar encuestas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <div>Cargando datos...</div>}
      {err && <div style={{ color: "#dc2626" }}>{err}</div>}

      {!loading && !err && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(15,23,42,.08)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <tr>
                <th style={thStyle}>Nombre de encuesta</th>
                <th style={thStyle}>Respuestas</th>
                <th style={thStyle}>Personas</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                    No se encontraron encuestas con respuestas.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{row.title}</td>
                    <td style={tdStyle}>{row.answersCount}</td>
                    <td style={tdStyle}>{row.respondentsCount}</td>
                    <td style={tdStyle}>{formatDate(row.createdAt)}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => nav(`/surveys/${row.id}`)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#4f46e5",
                          cursor: "pointer",
                          fontSize: 14,
                        }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div
            style={{
              padding: "8px 16px",
              fontSize: 12,
              color: "#6b7280",
              textAlign: "right",
            }}
          >
            Mostrando {filtered.length} de {rows.length} encuestas
          </div>
        </div>
      )}
    </div>
  );
}

// estilos de celda reutilizables
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
