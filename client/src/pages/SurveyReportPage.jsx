// client/src/pages/SurveyReportPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function SurveyReportPage() {
  const { id } = useParams(); // id de la encuesta
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdmin =
    (user?.rol && user.rol.toLowerCase() === "admin") ||
    user?.is_superuser ||
    user?.isStaff;

  const reportRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAdmin]);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const [surveyRes, questionsRes, answersRes] = await Promise.all([
        api.get(`surveys/surveys/${id}/`),
        api.get("surveys/questions/"),
        api.get("surveys/answers/"),
      ]);

      const surveyData = surveyRes.data;
      const allQuestions = Array.isArray(questionsRes.data)
        ? questionsRes.data
        : [];
      const allAnswers = Array.isArray(answersRes.data)
        ? answersRes.data
        : [];

      const qs = allQuestions.filter((q) => q.survey === surveyData.id);
      const questionIds = new Set(qs.map((q) => q.id));
      const ans = allAnswers.filter((a) => questionIds.has(a.question));

      setSurvey(surveyData);
      setQuestions(qs);
      setAnswers(ans);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el reporte de esta encuesta.");
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    if (!reportRef.current) return;

    const title = survey ? `Reporte - ${survey.title}` : "Reporte de encuesta";
    const contenido = reportRef.current.innerHTML;

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            * {
              box-sizing: border-box;
              font-family: system-ui, -apple-system, BlinkMacSystemFont,
                "Segoe UI", sans-serif;
            }
            body {
              margin: 0;
              padding: 24px;
              background: #ffffff;
            }
            h1, h2, h3, h4, h5 {
              margin-top: 0;
            }
            .card {
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              padding: 16px;
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          ${contenido}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

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

  const totalQuestions = questions.length;
  const totalAnswers = answers.length;
  const peopleSet = new Set();
  answers.forEach((a) => {
    if (a.user != null) peopleSet.add(a.user);
  });
  const totalPeople = peopleSet.size;

  const answersByQuestion = new Map();
  answers.forEach((a) => {
    if (!answersByQuestion.has(a.question)) {
      answersByQuestion.set(a.question, []);
    }
    answersByQuestion.get(a.question).push(a);
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* HEADER (no se imprime) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              margin: 0,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Reporte de encuesta
          </h1>
          {survey && (
            <p style={{ margin: 0, color: "#6b7280" }}>
              {survey.title} · creada el {formatDate(survey.created_at)}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/reports" style={linkBtn}>
            ← Volver a reportes
          </Link>
          <button type="button" style={printBtn} onClick={handlePrint}>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* CONTENIDO QUE VA AL PDF */}
      <div ref={reportRef}>
        {loading && <div>Cargando reporte...</div>}
        {err && (
          <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>
        )}

        {!loading && !err && survey && (
          <>
            <div
              className="card"
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
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Resumen de la encuesta
              </h2>
              {survey.description && (
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: 12,
                    color: "#4b5563",
                    fontSize: 14,
                  }}
                >
                  {survey.description}
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <MiniKpi label="Preguntas" value={totalQuestions} />
                <MiniKpi label="Respuestas" value={totalAnswers} />
                <MiniKpi
                  label="Personas participantes"
                  value={totalPeople}
                />
              </div>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {questions.map((q, index) => {
                const qAnswers = answersByQuestion.get(q.id) || [];

                return (
                  <div
                    key={q.id}
                    className="card"
                    style={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      padding: 12,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "baseline",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Pregunta {index + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          {q.text}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Tipo: <strong>{q.question_type}</strong> · Respuestas:{" "}
                        <strong>{qAnswers.length}</strong>
                      </div>
                    </div>

                    {qAnswers.length === 0 && (
                      <p
                        style={{
                          marginTop: 8,
                          marginBottom: 0,
                          fontSize: 13,
                          color: "#9ca3af",
                        }}
                      >
                        Aún no hay respuestas registradas para esta pregunta.
                      </p>
                    )}

                    {qAnswers.length > 0 && (
                      <p
                        style={{
                          marginTop: 8,
                          marginBottom: 0,
                          fontSize: 13,
                          color: "#4b5563",
                        }}
                      >
                        Esta pregunta ya fue respondida{" "}
                        <strong>{qAnswers.length}</strong> vez
                        {qAnswers.length !== 1 && "es"}.
                      </p>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div>No hay preguntas cargadas para esta encuesta.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniKpi({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "#6b7280",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

const linkBtn = {
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  padding: "6px 12px",
  fontSize: 13,
  textDecoration: "none",
  color: "#111827",
  background: "#ffffff",
};

const printBtn = {
  borderRadius: 999,
  border: "none",
  padding: "6px 12px",
  fontSize: 13,
  textDecoration: "none",
  color: "#ffffff",
  background: "#4f46e5",
  cursor: "pointer",
};
