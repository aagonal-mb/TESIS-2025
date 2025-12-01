// client/src/pages/SurveyBuilderPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { createSurvey } from "../api/surveys.api";
import { useAuth } from "../context/AuthContext";
import QuestionBuilderItem from "../components/QuestionBuilderItem";

const QUESTION_TYPES = [
  { value: "text", label: "Texto corto" },
  { value: "longtext", label: "Texto largo" },
  { value: "bool", label: "Verdadero/Falso" },
  { value: "scale", label: "Escala 1–5" },
  { value: "rating", label: "Valoración (Estrellas)" },
  { value: "choice", label: "Opción única (Radio)" },
  { value: "multi", label: "Selección múltiple (Checkbox)" },
  { value: "dropdown", label: "Desplegable (Select)" },
  { value: "number", label: "Número" },
  { value: "date", label: "Fecha" },
  // { value: "rank", label: "Clasificación (Ranking)" }, // si querés dejarlo para más adelante
];


export default function SurveyBuilderPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { id: 1, text: "", question_type: "text", required: true, choices: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        No tenés permisos para crear encuestas.
      </div>
    );
  }

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        question_type: "text",
        required: false,
        choices: [],
      },
    ]);
  };

  const updateQuestion = (qid, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, [field]: value } : q))
    );
  };

  const removeQuestion = (qid) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const updateChoices = (qid, newChoices) => {
    updateQuestion(qid, "choices", newChoices);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    if (!title.trim()) {
      setErr("La encuesta necesita un título.");
      return;
    }

    const validQuestions = questions.filter((q) => q.text.trim() !== "");

    if (!validQuestions.length) {
      setErr("Agregá al menos una pregunta con texto.");
      return;
    }

    setSaving(true);
    try {
      // 1) Crear la encuesta
      const { data: survey } = await createSurvey({
        title,
        description,
        status: true, // activa
      });

      // 2) Crear cada pregunta asociada
      await Promise.all(
        validQuestions.map((q) => {
          // Tipos que REQUIEREN el campo 'choices'
          const typesThatNeedChoices = [
            "choice",
            "multi",
            "dropdown",
            "rank",
            "matrix",
          ];

          const choicesToSend = typesThatNeedChoices.includes(q.question_type)
            ? q.choices.filter((c) => c.trim() !== "").join(";")
            : null;

          return api.post("surveys/questions/", {
            survey: survey.id,
            text: q.text,
            question_type: q.question_type,
            required: q.required,
            choices: choicesToSend,
          });
        })
      );

      setSuccess("Encuesta creada correctamente 🙌");

      // Limpiar formulario
      setTitle("");
      setDescription("");
      setQuestions([
        {
          id: 1,
          text: "",
          question_type: "text",
          required: true,
          choices: [],
        },
      ]);
    } catch (e) {
      console.error(e);
      setErr("No se pudo crear la encuesta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 24,
            margin: 0,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Crear encuesta
        </h1>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Definí el título, descripción y las preguntas.
        </p>
      </div>

      {/* MENSAJES */}
      {err && (
        <div style={{ marginBottom: 12, color: "#dc2626" }}>{err}</div>
      )}
      {success && (
        <div style={{ marginBottom: 12, color: "#16a34a" }}>{success}</div>
      )}

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit}>
        {/* Título y Descripción */}
        <div className="auth-field">
          <label>Título de la encuesta</label>
          <input
            className="auth-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Clima laboral 2025"
          />
        </div>

        <div className="auth-field">
          <label>Descripción (opcional)</label>
          <textarea
            className="auth-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción..."
          />
        </div>

        <hr style={{ margin: "1.5rem 0" }} />

        <h2 style={{ marginBottom: 8 }}>Preguntas</h2>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Podés usar {QUESTION_TYPES.length} tipos de pregunta diferentes.
        </p>

                {questions.map((q, idx) => (
          <QuestionBuilderItem
            key={q.id}
            question={q}
            index={idx}
            types={QUESTION_TYPES}
            updateQuestion={updateQuestion}
            updateChoices={updateChoices}
            removeQuestion={removeQuestion}
            canRemove={questions.length > 1}
          />
        ))}


        <button
          type="button"
          className="auth-btn"
          style={{ maxWidth: 220, marginBottom: 16 }}
          onClick={addQuestion}
        >
          + Agregar pregunta
        </button>

        <div>
          <button
            className="auth-btn"
            type="submit"
            disabled={saving}
            style={{ maxWidth: 260 }}
          >
            {saving ? "Guardando..." : "Guardar encuesta"}
          </button>
        </div>
      </form>
    </div>
  );
}
