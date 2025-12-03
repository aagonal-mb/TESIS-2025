// client/src/pages/SurveyDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSurvey } from "../api/surveys.api";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import QuestionAnswerItem from "../components/QuestionAnswerItem";

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

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  // 💡 FUNCIÓN DE PARSING DE OPCIONES
  const parseChoices = (choices) => {
    if (typeof choices !== "string" || choices.trim() === "") {
      return choices || [];
    }

    const trimmedChoices = choices.trim();

    // Caso 1: Array serializado como string (e.g., "['opt1', 'opt2']")
    if (trimmedChoices.startsWith("[") && trimmedChoices.endsWith("]")) {
      try {
        // Intentamos parsear JSON (reemplazando comillas simples de Python a dobles)
        return JSON.parse(trimmedChoices.replace(/'/g, '"'));
      } catch (e) {
        // Fallback a división por coma o punto y coma
      }
    }

    // Caso 2: String separado por punto y coma (formato que enviamos al backend)
    if (trimmedChoices.includes(';')) {
      return trimmedChoices.split(';').filter(c => c.trim() !== "");
    }

    // Caso 3: String simple o array vacío como fallback
    return [trimmedChoices];
  };

  // --- Carga Inicial ---
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
        const allQuestions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
        const filtered = allQuestions.filter((q) => String(q.survey) === String(id));

        // ✅ CORRECCIÓN DE PARSING APLICADA
        const processedQuestions = filtered.map(q => ({
          ...q,
          choices: parseChoices(q.choices), // Usamos la función robusta
        }));

        setQuestions(processedQuestions);

      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la encuesta o sus preguntas.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // --- Manejo de Cambios (sin cambios) ---
  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // --- Envío del Formulario (sin cambios, ya corrige el payload a 'response') ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!questions.length) {
      setError("Esta encuesta no tiene preguntas.");
      return;
    }

    const payloads = questions
      .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "" && answers[q.id] !== null)
      .map((q) => ({
        question: q.id,
        user: user?.idUsuario,
        response: answers[q.id],
      }));

    if (!payloads.length) {
      setError("Respondé al menos una pregunta antes de enviar.");
      return;
    }

    const requiredQuestions = questions.filter(q => q.required);
    const missingRequired = requiredQuestions.some(q => !answers[q.id] || answers[q.id] === "");

    if (missingRequired) {
      setError("Por favor, respondé todas las preguntas obligatorias (*).");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(payloads.map((p) => api.post("surveys/answers/", p)));
      setSuccess("Tus respuestas se guardaron correctamente 🙌");
      setAnswers({});

    } catch (e) {
      console.error(e);
      const errorDetail = e.response?.data ? JSON.stringify(e.response.data) : "No se pudieron guardar las respuestas.";
      setError(`Error al guardar: ${errorDetail}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Renderizado ---
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
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: 8, fontSize: "2rem" }}>{survey.title}</h1>

      {survey.description && (
        <p style={{ marginBottom: 16, color: "#4b5563" }}>
          {survey.description}
        </p>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {/* Botón de Resultados */}
          <button
            type="button"
            className="auth-btn"
            style={{ maxWidth: 220, background: '#10b981', borderColor: '#10b981' }}
            onClick={() => nav(`/reports/surveys/${survey.id}`)}
          >
            Ver resultados
          </button>
          {/* ✅ BOTÓN DE ASIGNACIÓN */}
          <button
            type="button"
            className="auth-btn"
            style={{ maxWidth: 220, background: '#3b82f6', borderColor: '#3b82f6' }}
            onClick={() => nav(`/surveys/${survey.id}/assign`)}
          >
            Asignar encuesta
          </button>
        </div>
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
            <div key={q.id}>
              <QuestionAnswerItem
                question={q}
                currentResponse={answers[q.id]}
                onResponseChange={handleChange}
              />
            </div>
          ))}

          <button
            className="auth-btn"
            type="submit"
            disabled={saving}
            style={{ maxWidth: 220, marginTop: "1rem" }}
          >
            {saving ? "Guardando..." : "Enviar respuestas"}
          </button>
        </form>
      )}
    </div>
  );
}