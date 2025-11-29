// client/src/pages/SurveyBuilderPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { createSurvey } from "../api/surveys.api";
import { useAuth } from "../context/AuthContext";

export default function SurveyBuilderPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    { id: 1, text: "", question_type: "text", required: true },
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
        validQuestions.map((q) =>
          api.post("surveys/questions/", {
            survey: survey.id,
            text: q.text,
            question_type: q.question_type, // "text" o "scale"
            required: q.required,
            choices: null, // para scale no hace falta
          })
        )
      );

      setSuccess("Encuesta creada correctamente 🙌");
      // Limpio formulario o mando al listado:
      setTitle("");
      setDescription("");
      setQuestions([
        { id: 1, text: "", question_type: "text", required: true },
      ]);

      // si preferís, podés navegar directo a la lista:
      // navigate("/surveys");
    } catch (e) {
      console.error(e);
      setErr("No se pudo crear la encuesta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Crear nueva encuesta</h1>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Definí el título, descripción y las preguntas. Luego se podrá responder
        desde el listado de encuestas.
      </p>

      {err && (
        <div style={{ marginBottom: 12, color: "#dc2626" }}>
          {err}
        </div>
      )}
      {success && (
        <div style={{ marginBottom: 12, color: "#16a34a" }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Título */}
        <div className="auth-field">
          <label>Título de la encuesta</label>
          <input
            className="auth-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Clima laboral 2025"
          />
        </div>

        {/* Descripción */}
        <div className="auth-field">
          <label>Descripción (opcional)</label>
          <textarea
            className="auth-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción para que el colaborador entienda de qué se trata."
          />
        </div>

        <hr style={{ margin: "1.5rem 0" }} />

        <h2 style={{ marginBottom: 8 }}>Preguntas</h2>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          Podés mezclar preguntas abiertas y escala 1–5.
        </p>

        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              marginBottom: 16,
              padding: 16,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <strong>Pregunta {idx + 1}</strong>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="auth-field">
              <label>Texto de la pregunta</label>
              <input
                className="auth-input"
                value={q.text}
                onChange={(e) =>
                  updateQuestion(q.id, "text", e.target.value)
                }
                placeholder='Ej: "¿Cómo evaluás el clima laboral?"'
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div className="auth-field" style={{ flex: "0 0 200px" }}>
                <label>Tipo</label>
                <select
                  className="auth-input"
                  value={q.question_type}
                  onChange={(e) =>
                    updateQuestion(q.id, "question_type", e.target.value)
                  }
                >
                  <option value="text">Texto libre</option>
                  <option value="scale">Escala 1–5</option>
                </select>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) =>
                    updateQuestion(q.id, "required", e.target.checked)
                  }
                />
                Obligatoria
              </label>
            </div>
          </div>
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
