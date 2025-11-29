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
    async function load() {
      setErr("");
      setLoading(true);
      try {
        // 1) encuesta
        const surveyRes = await getSurvey(id);

        // 2) preguntas
        const qRes = await api.get("surveys/questions/");

        // 3) respuestas
        const aRes = await api.get("surveys/answers/");

        setSurvey(surveyRes.data);

        const allQuestions = Array.isArray(qRes.data) ? qRes.data : [];
        const surveyQuestions = allQuestions.filter(
          (q) => String(q.survey) === String(id)
        );
        setQuestions(surveyQuestions);

        const allAnswers = Array.isArray(aRes.data) ? aRes.data : [];
        setAnswers(allAnswers);
      } catch (e) {
        console.error(e);
        setErr("No se pudieron cargar los resultados.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // agrupar respuestas por pregunta
  const grouped = useMemo(() => {
    const byQuestion = {};
    const questionIds = questions.map((q) => q.id);

    answers
      .filter((a) => questionIds.includes(a.question))
      .forEach((a) => {
        if (!byQuestion[a.question]) byQuestion[a.question] = [];
        byQuestion[a.question].push(a);
      });

    return byQuestion;
  }, [answers, questions]);

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para ver los resultados de las encuestas.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando resultados…</div>;
  }

  if (err) {
    return (
      <div style={{ padding: 24, color: "#b91c1c" }}>
        {err}
      </div>
    );
  }

  if (!survey) {
    return <div style={{ padding: 24 }}>No se encontró la encuesta.</div>;
  }

  const totalRespuestas = Object.values(grouped).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1.5rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: 4 }}>
        Resultados: {survey.title}
      </h1>
      {survey.description && (
        <p style={{ color: "#4b5563", marginBottom: 12 }}>
          {survey.description}
        </p>
      )}

      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Total de respuestas registradas:{" "}
        <strong>{totalRespuestas || 0}</strong>
      </p>

      {questions.length === 0 ? (
        <p>Esta encuesta todavía no tiene preguntas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {questions.map((q) => {
            const respuestas = grouped[q.id] || [];

            // si es escala 1-5 calculamos promedio y distribución
            let stats = null;
            if (q.question_type === "scale" && respuestas.length > 0) {
              const nums = respuestas
                .map((r) => Number(r.response))
                .filter((n) => !Number.isNaN(n));

              const prom =
                nums.length > 0
                  ? nums.reduce((acc, n) => acc + n, 0) / nums.length
                  : null;

              const conteo = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              nums.forEach((n) => {
                if (conteo[n] !== undefined) conteo[n] += 1;
              });

              stats = { prom, conteo, total: nums.length };
            }

            return (
              <div
                key={q.id}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 4,
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {q.text}{" "}
                  {q.required && (
                    <span style={{ color: "#dc2626" }}>*</span>
                  )}
                </h3>

                <p
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    color: "#6b7280",
                    fontSize: 13,
                  }}
                >
                  Tipo:{" "}
                  {q.question_type === "scale"
                    ? "Escala (1 a 5)"
                    : "Texto libre"}
                  {" · "}
                  Respuestas: <strong>{respuestas.length}</strong>
                </p>

                {q.question_type === "scale" ? (
                  respuestas.length === 0 ? (
                    <p style={{ color: "#9ca3af", fontSize: 13 }}>
                      Aún no hay respuestas.
                    </p>
                  ) : (
                    <div style={{ fontSize: 14 }}>
                      {stats.prom != null && (
                        <p style={{ margin: "4px 0" }}>
                          Promedio:{" "}
                          <strong>{stats.prom.toFixed(2)}</strong>
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          marginTop: 4,
                        }}
                      >
                        {Object.entries(stats.conteo).map(([val, cant]) => (
                          <span
                            key={val}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "#eef2ff",
                              color: "#4f46e5",
                              fontSize: 12,
                            }}
                          >
                            {val}: {cant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                ) : respuestas.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13 }}>
                    Aún no hay respuestas.
                  </p>
                ) : (
                  <ul
                    style={{
                      marginTop: 6,
                      paddingLeft: 18,
                      fontSize: 14,
                      color: "#374151",
                    }}
                  >
                    {respuestas.map((r) => (
                      <li key={r.id}>{r.response}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
