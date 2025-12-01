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

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setErr("");
      setLoading(true);
      try {
        const [surveysRes, questionsRes, answersRes] = await Promise.all([
          api.get("surveys/surveys/"),
          api.get("surveys/questions/"),
          api.get("surveys/answers/"),
        ]);

        if (cancelled) return;

        const surveys = Array.isArray(surveysRes.data) ? surveysRes.data : [];
        const questions = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : [];
        const answers = Array.isArray(answersRes.data) ? answersRes.data : [];

        // Map preguntaId -> surveyId
        const questionSurvey = new Map();
        questions.forEach((q) => {
          if (q && q.id != null && q.survey != null) {
            questionSurvey.set(q.id, q.survey);
          }
        });

        // Stats por encuesta
        const statsBySurvey = new Map();
        answers.forEach((a) => {
          const surveyId = questionSurvey.get(a.question);
          if (!surveyId) return;

          if (!statsBySurvey.has(surveyId)) {
            statsBySurvey.set(surveyId, {
              answers: 0,
              users: new Set(),
            });
          }
          const info = statsBySurvey.get(surveyId);
          info.answers += 1;
          if (a.user != null) {
            info.users.add(a.user);
          }
        });

        const rowsData = surveys.map((s) => {
          const stats = statsBySurvey.get(s.id) || {
            answers: 0,
            users: new Set(),
          };

          const questionCount = questions.filter(
            (q) => q.survey === s.id
          ).length;

          return {
            id: s.id,
            title: s.title,
            createdAt: s.created_at,
            questionCount,
            answerCount: stats.answers,
            respondentCount: stats.users.size,
          };
        });

        rowsData.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt) : 0;
          const db = b.createdAt ? new Date(b.createdAt) : 0;
          return db - da;
        });

        setRows(rowsData);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar las encuestas respondidas.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver esta página.
      </div>
    );
  }

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
          <h1 style={{ fontSize: 24, margin: 0 }}>Resultados de encuestas</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Vista para administración de encuestas respondidas.
          </p>
        </div>

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

      {!loading && !err && filtered.length === 0 && (
        <div>No se encontraron encuestas que coincidan con la búsqueda.</div>
      )}

      {!loading && !err && filtered.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>Encuesta</th>
                <th style={thStyle}>Preguntas</th>
                <th style={thStyle}>Respuestas</th>
                <th style={thStyle}>Personas</th>
                <th style={thStyle}>Creada</th>
                <th style={thStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <td style={tdStyle}>{row.title}</td>
                  <td style={tdStyle}>{row.questionCount}</td>
                  <td style={tdStyle}>{row.answerCount}</td>
                  <td style={tdStyle}>{row.respondentCount}</td>
                  <td style={tdStyle}>{formatDate(row.createdAt)}</td>
                  <td style={tdStyle}>
                    <button
  type="button"
  onClick={() => nav(`/surveys/responses/${row.id}`)}  // 👈 CAMBIO ACÁ
  style={{
    border: "none",
    background: "#4f46e5",
    color: "#ffffff",
    cursor: "pointer",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
  }}
>
  Ver respuestas
</button>

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
