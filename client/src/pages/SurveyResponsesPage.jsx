// client/src/pages/SurveyResponsesPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function SurveyResponsesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

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
        const questions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
        const answers = Array.isArray(answersRes.data) ? answersRes.data : [];

        // Mapeo pregunta → encuesta
        const questionToSurvey = {};
        questions.forEach((q) => {
          if (q.id != null && q.survey != null) {
            questionToSurvey[q.id] = q.survey;
          }
        });

        // Conteo de respuestas por encuesta
        const counts = {};
        answers.forEach((a) => {
          const surveyId = questionToSurvey[a.question];
          if (!surveyId) return;
          counts[surveyId] = (counts[surveyId] || 0) + 1;
        });

        const tableRows = surveys.map((s) => ({
          id: s.id,
          title: s.title,
          created_at: s.created_at,
          totalResponses: counts[s.id] || 0,
        }));

        if (alive) setRows(tableRows);
      } catch (e) {
        console.error(e);
        if (alive) setErr("No se pudo cargar las encuestas respondidas.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (!user) return null;

  if (loading) return <div style={{ padding: 24 }}>Cargando encuestas…</div>;

  if (err)
    return (
      <div style={{ padding: 24, color: "#b91c1c" }}>
        {err}
      </div>
    );

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: "0 1.5rem" }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#111827" }}>
        Encuestas respondidas
      </h2>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Visualizá cuántas respuestas tiene cada encuesta.
      </p>

      {rows.length === 0 ? (
        <div style={{ color: "#4b5563" }}>Todavía no hay respuestas.</div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: 8,
            background: "#ffffff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15,23,42,.06)",
          }}
        >
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={thStyle}>Nombre de encuesta</th>
              <th style={thStyle}>Respuestas</th>
              <th style={thStyle}>Fecha de creación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                <td style={tdStyle}>{row.title}</td>
                <td style={tdStyle}>{row.totalResponses}</td>
                <td style={tdStyle}>
                  {row.created_at
                    ? new Date(row.created_at).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const tdStyle = {
  padding: "10px 16px",
  fontSize: "0.9rem",
  color: "#111827",
};
