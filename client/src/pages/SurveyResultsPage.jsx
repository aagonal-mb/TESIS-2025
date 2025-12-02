// client/src/pages/SurveyResultsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getSurvey } from "../api/surveys.api";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function SurveyResultsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [surveyRes, questionsRes, answersRes] = await Promise.all([
          getSurvey(id),
          api.get(`surveys/surveys/${id}/questions/`),
          api.get("surveys/answers/"),
        ]);

        if (!alive) return;

        setSurvey(surveyRes.data || null);
        setQuestions(questionsRes.data || []);
        setAnswers(answersRes.data || []);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar los resultados de la encuesta.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const grouped = useMemo(() => {
    if (!questions.length) return [];

    const byQuestionId = new Map();

    // Inicializar grupos
    questions.forEach((q) => {
      byQuestionId.set(q.id, {
        question: q,
        answers: [],
      });
    });

    // Asignar respuestas a cada pregunta
    answers.forEach((a) => {
      const group = byQuestionId.get(a.question);
      if (group) {
        group.answers.push(a);
      }
    });

    return Array.from(byQuestionId.values());
  }, [questions, answers]);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver esta página.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>
          KPIs de encuesta
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

      {loading && <div>Cargando resultados...</div>}
      {err && <div style={{ color: "#dc2626" }}>{err}</div>}

      {!loading && !err && grouped.length === 0 && (
        <div>No hay preguntas registradas para esta encuesta.</div>
      )}

      {!loading && !err && grouped.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {grouped.map(({ question, answers }) => {
            const total = answers.length;

            let numericAvg = null;
            let distribution = null;

            if (
              question.question_type === "scale" ||
              question.question_type === "number"
            ) {
              const nums = answers
                .map((a) => Number(a.response))
                .filter((n) => !Number.isNaN(n));

              if (nums.length) {
                const sum = nums.reduce((acc, n) => acc + n, 0);
                numericAvg = sum / nums.length;

                const dist = {};
                nums.forEach((n) => {
                  const key = String(n);
                  dist[key] = (dist[key] || 0) + 1;
                });
                distribution = dist;
              }
            }

            return (
              <div
                key={question.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                  background: "#ffffff",
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {question.text}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    Tipo: {question.question_type} · Respuestas: {total}
                  </div>
                </div>

                {/* Métricas numéricas si aplica */}
                {numericAvg !== null && (
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Promedio
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      {numericAvg.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Distribución si la calculamos */}
                {distribution && (
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Distribución de respuestas
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {Object.entries(distribution).map(([value, count]) => (
                        <li
                          key={value}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            fontSize: 12,
                          }}
                        >
                          {value}: {count}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Listado de respuestas textuales si no es numérica */}
                {numericAvg === null && total > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Respuestas
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                      {answers.map((a) => (
                        <li key={a.id}>{a.response}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {total === 0 && (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    Todavía no hay respuestas para esta pregunta.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
