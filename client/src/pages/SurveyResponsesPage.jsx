// client/src/pages/SurveyResponsesPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { getSurvey } from "../api/surveys.api";

export default function SurveyResponsesPage() {
  const { id } = useParams(); // id de la encuesta
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [rows, setRows] = useState([]);
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
        // Traemos: encuesta, sus preguntas, todas las respuestas y los usuarios
        const [surveyRes, questionsRes, answersRes, usuariosRes] =
          await Promise.all([
            getSurvey(id),
            api.get(`surveys/surveys/${id}/questions/`),
            api.get("surveys/answers/"),
            api.get("accounts/usuarios/"),
          ]);

        if (cancelled) return;

        const surveyData = surveyRes.data;
        const questions = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : [];
        const answers = Array.isArray(answersRes.data)
          ? answersRes.data
          : [];
        const usuarios = Array.isArray(usuariosRes.data)
          ? usuariosRes.data
          : [];

        // Map: preguntaId -> objeto pregunta
        const questionById = new Map();
        questions.forEach((q) => {
          if (q && q.id != null) {
            questionById.set(q.id, q);
          }
        });

        // Map: authUserId -> nombre lindo
        const userNameByAuthId = new Map();
        usuarios.forEach((u) => {
          const authId = u.user && u.user.id;
          if (authId == null) return;

          const fullName = `${u.nombre || ""} ${u.apellido || ""}`.trim();
          const fallback = (u.user && u.user.username) || `Usuario ${authId}`;
          const name = fullName || fallback;

          userNameByAuthId.set(authId, name);
        });

        // Armamos filas solo con respuestas de ESTA encuesta
        const tableRows = answers
          .filter((a) => questionById.has(a.question))
          .map((a) => {
            const q = questionById.get(a.question);
            const userName =
              userNameByAuthId.get(a.user) || `Usuario ${a.user}`;
            return {
              id: a.id,
              questionText: q.text,
              userName,
              response: a.response,
            };
          });

        setSurvey(surveyData);
        setRows(tableRows);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar las respuestas de esta encuesta.");
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
  }, [id]);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver esta página.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          Respuestas de la encuesta
        </h1>
        {survey && (
          <>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {survey.title}
            </div>
            {survey.description && (
              <p style={{ marginTop: 4, color: "#6b7280" }}>
                {survey.description}
              </p>
            )}
          </>
        )}
      </div>

      {loading && <div>Cargando respuestas...</div>}
      {err && <div style={{ color: "#dc2626" }}>{err}</div>}

      {!loading && !err && rows.length === 0 && (
        <div style={{ color: "#6b7280" }}>
          Todavía no hay respuestas registradas para esta encuesta.
        </div>
      )}

      {!loading && !err && rows.length > 0 && (
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
                <th style={thStyle}>Colaborador</th>
                <th style={thStyle}>Pregunta</th>
                <th style={thStyle}>Respuesta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderTop: "1px solid #e5e7eb" }}
                >
                  <td style={tdStyle}>{row.userName}</td>
                  <td style={tdStyle}>{row.questionText}</td>
                  <td style={tdStyle}>{row.response}</td>
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
