// src/components/QuestionsTab.jsx
import { useEffect, useState } from "react";
import api from "../api";

export default function QuestionsTab({ surveyId }) {
  const [list, setList] = useState([]);
  const [text, setText] = useState("");
  const [type, setType] = useState("text");
  const [required, setRequired] = useState(true);
  const [choicesRaw, setChoicesRaw] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const needsChoices = ["choice", "multi", "dropdown", "rank", "matrix"].includes(type);

  const load = async () => {
    setError(null);
    try {
      const { data } = await api.get(`/surveys/${surveyId}/questions/`);
      setList(data);
    } catch {
      setError("No pude cargar las preguntas.");
    }
  };

  const create = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = { text, question_type: type, required };
      if (needsChoices) {
        payload.choices = choicesRaw
          .split(";")
          .map(s => s.trim())
          .filter(Boolean);
      }
      // Ruta anidada → NO mandamos "survey" en el body
      const { data } = await api.post(`/surveys/${surveyId}/questions/`, payload);
      setList(prev => [data, ...prev]);
      setText(""); setType("text"); setRequired(true); setChoicesRaw("");
    } catch (e) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : "Error creando la pregunta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [surveyId]);

  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
      <h3 style={{ marginBottom: 12 }}>Questions (Survey #{surveyId})</h3>

      {error && <div style={{ color: "crimson", fontSize: 13, marginBottom: 8 }}>{error}</div>}

      {/* Formulario */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Texto de la pregunta"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
        />

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
        >
          <option value="text">Texto</option>
          <option value="bool">Verdadero/Falso</option>
          <option value="scale">Escala 1-5</option>
          <option value="choice">Opción única</option>
          <option value="multi">Selección múltiple</option>
          <option value="dropdown">Desplegable</option>
        </select>

        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} />
          Requerida
        </label>

        {/* Solo mostramos el input de opciones si el tipo lo necesita */}
        {needsChoices && (
          <input
            placeholder="Opciones separadas por ;  (Ej: Excelente;Bueno;Regular;Malo)"
            value={choicesRaw}
            onChange={e => setChoicesRaw(e.target.value)}
            style={{ padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
          />
        )}

        <button
          onClick={create}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "#2563eb",
            color: "white",
            border: "none",
            width: "fit-content",
            cursor: "pointer",
          }}
        >
          {loading ? "Creando..." : "Crear pregunta"}
        </button>
      </div>

      {/* Listado */}
      <ul style={{ display: "grid", gap: 8 }}>
        {list.map(q => (
          <li key={q.id} style={{ background: "#f3f4f6", padding: 10, borderRadius: 10, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>{q.text}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Tipo: {q.question_type} · Survey #{q.survey} {q.required ? "· requerida" : ""}
            </div>
            {q?.choices?.length ? (
              <div style={{ fontSize: 12, marginTop: 4 }}>Opciones: {q.choices.join(" / ")}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
