// client/src/pages/ReportsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdmin =
    (user?.rol && user.rol.toLowerCase() === "admin") ||
    user?.is_superuser ||
    user?.isStaff;

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const [surveysRes, questionsRes, answersRes] = await Promise.all([
        api.get("surveys/surveys/"),
        api.get("surveys/questions/"),
        api.get("surveys/answers/"),
      ]);

      setSurveys(Array.isArray(surveysRes.data) ? surveysRes.data : []);
      setQuestions(Array.isArray(questionsRes.data) ? questionsRes.data : []);
      setAnswers(Array.isArray(answersRes.data) ? answersRes.data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        Solo los usuarios administradores pueden ver los reportes.
      </div>
    );
  }

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-AR");
    } catch {
      return iso;
    }
  };

  // KPIs generales
  const totalSurveys = surveys.length;
  const totalAnswers = answers.length;

  const peopleSet = new Set();
  answers.forEach((a) => {
    if (a.user != null) peopleSet.add(a.user);
  });
  const totalPeople = peopleSet.size;

  // índices para armar la tabla por encuesta
  const questionsBySurvey = new Map();
  questions.forEach((q) => {
    if (!questionsBySurvey.has(q.survey)) {
      questionsBySurvey.set(q.survey, []);
    }
    questionsBySurvey.get(q.survey).push(q);
  });

  const answersBySurvey = new Map();
  answers.forEach((a) => {
    const q = questions.find((q) => q.id === a.question);
    if (!q) return;
    if (!answersBySurvey.has(q.survey)) {
      answersBySurvey.set(q.survey, []);
    }
    answersBySurvey.get(q.survey).push(a);
  });

  const peopleBySurvey = new Map();
  answers.forEach((a) => {
    const q = questions.find((q) => q.id === a.question);
    if (!q) return;
    if (!peopleBySurvey.has(q.survey)) {
      peopleBySurvey.set(q.survey, new Set());
    }
    if (a.user != null) {
      peopleBySurvey.get(q.survey).add(a.user);
    }
  });

  // Datos para el gráfico comparativo: encuestas vs participación
  const chartData = surveys.map((s) => {
    const ans = answersBySurvey.get(s.id) || [];
    const peopleForSurvey = peopleBySurvey.get(s.id) || new Set();

    const shortTitle =
      s.title && s.title.length > 30
        ? s.title.slice(0, 27) + "..."
        : s.title || `Encuesta ${s.id}`;

    return {
      id: s.id,
      name: shortTitle,
      respuestas: ans.length,
      participantes: peopleForSurvey.size,
    };
  });

  // Ordenamos por cantidad de respuestas (de mayor a menor)
  const chartDataTop = [...chartData].sort(
    (a, b) => b.respuestas - a.respuestas
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 24,
          marginTop: 0,
          marginBottom: 16,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Reportes de encuestas
      </h1>

      {/* KPIs generales */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <MiniKpi label="Encuestas creadas" value={totalSurveys} />
        <MiniKpi label="Respuestas registradas" value={totalAnswers} />
        <MiniKpi label="Personas participantes" value={totalPeople} />
      </div>

      {loading && <div>Cargando reportes...</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>}

      {!loading && !err && surveys.length === 0 && (
        <div>No hay encuestas creadas todavía.</div>
      )}

      {!loading && !err && surveys.length > 0 && (
        <>
          {/* GRÁFICO COMPARATIVO */}
          {chartDataTop.length > 0 && (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
                background: "#ffffff",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  marginTop: 0,
                  marginBottom: 4,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Participación por encuesta
              </h2>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Comparación de encuestas según la cantidad de respuestas
                registradas y personas que participaron en cada una.
              </p>

              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataTop}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "respuestas") {
                          return [
                            `${value} respuesta${
                              value === 1 ? "" : "s"
                            }`,
                            "Respuestas",
                          ];
                        }
                        if (name === "participantes") {
                          return [
                            `${value} persona${
                              value === 1 ? "" : "s"
                            }`,
                            "Participantes",
                          ];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="respuestas" fill="#4f46e5" />
                    <Bar dataKey="participantes" fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TABLA POR ENCUESTA */}
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
                  <th style={thStyle}>Encuesta</th>
                  <th style={thStyle}>Preguntas</th>
                  <th style={thStyle}>Respuestas</th>
                  <th style={thStyle}>Personas</th>
                  <th style={thStyle}>Completitud</th>
                  <th style={thStyle}>Creada</th>
                  <th style={thStyle}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => {
                  const qs = questionsBySurvey.get(s.id) || [];
                  const ans = answersBySurvey.get(s.id) || [];
                  const peopleSetForSurvey =
                    peopleBySurvey.get(s.id) || new Set();

                  // % de completitud aproximado para esta encuesta
                  let completionRate = 0;
                  const totalSlots =
                    qs.length * peopleSetForSurvey.size;
                  if (totalSlots > 0) {
                    completionRate = Math.round(
                      (ans.length / totalSlots) * 100
                    );
                    if (completionRate > 100) completionRate = 100;
                  }

                  return (
                    <tr
                      key={s.id}
                      style={{ borderTop: "1px solid #e5e7eb" }}
                    >
                      <td style={tdStyle}>{s.title}</td>
                      <td style={tdStyle}>{qs.length}</td>
                      <td style={tdStyle}>{ans.length}</td>
                      <td style={tdStyle}>
                        {peopleSetForSurvey.size}
                      </td>
                      <td style={tdStyle}>{completionRate}%</td>
                      <td style={tdStyle}>
                        {formatDate(s.created_at)}
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          style={btnPrimary}
                          onClick={() =>
                            navigate(`/reports/surveys/${s.id}`)
                          }
                        >
                          Ver reporte
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function MiniKpi({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 16,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
        {value}
      </div>
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
