// client/src/pages/SurveyDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSurvey } from "../api/surveys.api";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function SurveyDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 👑 quién es admin
  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  useEffect(() => {
    async function load() {
      setError("");
      setSuccess("");
      setLoading(true);
      try {
        const [surveyRes, questionsRes] = await Promise.all([
          getSurvey(id),
          api.get("surveys/questions/"),
        ]);

        setSurvey(surveyRes.data);

        // Solo preguntas de ESTA encuesta
        const allQuestions = Array.isArray(questionsRes.data)
          ? questionsRes.data
          : [];
        const filtered = allQuestions.filter(
          (q) => String(q.survey) === String(id)
        );
        setQuestions(filtered);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la encuesta.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!questions.length) {
      setError("Esta encuesta no tiene preguntas.");
      return;
    }

    const payloads = questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
      .map((q) => ({
        question: q.id,
        user: user?.idUsuario, // id_usuario que ya usamos
        response: answers[q.id],
      }));

    if (!payloads.length) {
      setError("Respondé al menos una pregunta antes de enviar.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(payloads.map((p) => api.post("surveys/answers/", p)));
      setSuccess("Tus respuestas se guardaron correctamente 🙌");
    } catch (e) {
      console.error(e);
      setError("No se pudieron guardar las respuestas.");
    } finally {
      setSaving(false);
    }
  };

  // 🔌 acá después Ema mete su <TypeQuestion /> si quiere
  const renderInputFor = (q) => {
    const value = answers[q.id] ?? "";

    if (q.question_type === "scale") {
      return (
        <select
          className="auth-input"
          value={value}
          onChange={(e) => handleChange(q.id, e.target.value)}
        >
          <option value="">Seleccioná un valor</option>
          <option value="1">1 - Muy malo</option>
          <option value="2">2</option>
          <option value="3">3 - Normal</option>
          <option value="4">4</option>
          <option value="5">5 - Excelente</option>
        </select>
      );
    }

    return (
      <textarea
        className="auth-input"
        rows={3}
        value={value}
        onChange={(e) => handleChange(q.id, e.target.value)}
      />
    );
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando encuesta...</div>;

  if (error)
    return (
      <div style={{ padding: 24, color: "#dc2626" }}>
        {error}
      </div>
    );

  if (!survey)
    return <div style={{ padding: 24 }}>No se encontró la encuesta.</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>{survey.title}</h1>

      {survey.description && (
        <p style={{ marginBottom: 16, color: "#4b5563" }}>
          {survey.description}
        </p>
      )}

      {/* 🔍 Botón solo para admin: ver resultados */}
      {isAdmin && (
        <button
          type="button"
          className="auth-btn"
          style={{ maxWidth: 220, marginBottom: 20 }}
          onClick={() => nav(`/surveys/${survey.id}/results`)}
        >
          Ver resultados
        </button>
      )}

      {success && (
        <div style={{ marginBottom: 16, color: "#16a34a" }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16, color: "#dc2626" }}>
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <p style={{ color: "#4b5563", marginTop: "1rem" }}>
          Esta encuesta todavía no tiene preguntas.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 500,
                  color: "#111827",
                }}
              >
                {q.text}{" "}
                {q.required && <span style={{ color: "#dc2626" }}>*</span>}
              </label>

              {renderInputFor(q)}
            </div>
          ))}

          <button
            className="auth-btn"
            type="submit"
            disabled={saving}
            style={{ maxWidth: 220 }}
          >
            {saving ? "Guardando..." : "Enviar respuestas"}
          </button>
        </form>
      )}
    </div>
  );
}
