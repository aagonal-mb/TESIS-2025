// client/src/pages/SurveyDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSurvey, deleteSurvey } from "../api/surveys.api";
import {
  getQuestionsBySurvey,
  createQuestion,
  deleteQuestion,
  updateQuestion,
} from "../api/questions.api";
import { Trash2, Save, Plus, Edit } from "lucide-react";
import { toast } from "react-hot-toast";

function SurveyDetailPage() {
  const { id } = useParams(); // surveyId desde la URL
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);

  // -------- Estado para NUEVA pregunta --------
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(true);
  const [newChoices, setNewChoices] = useState(""); // "Excelente;Bueno;Regular;Malo"

  // -------- Estado para EDICIÓN --------
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingType, setEditingType] = useState("text");

  // Tipos disponibles
  const QUESTION_TYPES = [
    { value: "text", label: "Texto libre" },
    { value: "bool", label: "Verdadero/Falso" },
    { value: "scale", label: "Escala 1-5" },
    { value: "choice", label: "Opción múltiple" },
    { value: "multi", label: "Selección múltiple" },
    { value: "date", label: "Fecha" },
    { value: "rating", label: "Valoración" },
    { value: "phone", label: "Número de teléfono" },
    { value: "email", label: "Correo electrónico" },
  ];

  // Tipos que NECESITAN 'choices'
  const TYPES_NEED_CHOICES = ["choice", "multi", "dropdown", "rank", "matrix"];

  // Cargar encuesta + preguntas
  useEffect(() => {
    async function loadSurvey() {
      try {
        const { data } = await getSurvey(id);
        setSurvey(data);
      } catch (e) {
        toast.error("No pude cargar la encuesta");
        console.error(e);
      }
    }
    async function loadQuestions() {
      try {
        const { data } = await getQuestionsBySurvey(id);
        setQuestions(data);
      } catch (e) {
        toast.error("No pude cargar las preguntas");
        console.error(e);
      }
    }
    loadSurvey();
    loadQuestions();
  }, [id]);

  // Crear pregunta
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const payload = {
        text: newQuestion,
        question_type: newType,
        required: newRequired,
      };

      // Solo envíamos choices si el tipo lo requiere
      if (TYPES_NEED_CHOICES.includes(newType)) {
        const arr = newChoices
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        payload.choices = arr;
      }

      // POST /api/surveys/:id/questions/
      await createQuestion(id, payload);

      // limpiar form + refrescar listado
      setNewQuestion("");
      setNewType("text");
      setNewRequired(true);
      setNewChoices("");

      toast.success("Question created");
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
    } catch (err) {
      const msg =
        err?.response?.data
          ? JSON.stringify(err.response.data)
          : "Error creating question";
      toast.error(msg);
      console.error(err);
    }
  };

  // Eliminar pregunta
  const handleDeleteQuestion = async (questionId) => {
    const accepted = window.confirm("Are you sure you want to delete this question?");
    if (!accepted) return;
    try {
      await deleteQuestion(id, questionId);
      toast.success("Question deleted");
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
    } catch (e) {
      toast.error("Error deleting question");
      console.error(e);
    }
  };

  // Editar pregunta
  const handleEditQuestion = (q) => {
    setEditingId(q.id);
    setEditingText(q.text);
    setEditingType(q.question_type);
  };

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    try {
      await updateQuestion(id, editingId, {
        text: editingText,
        question_type: editingType,
      });
      toast.success("Question updated");
      setEditingId(null);
      setEditingText("");
      setEditingType("text");
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
    } catch (err) {
      toast.error("Error updating question");
      console.error(err);
    }
  };

  // Eliminar encuesta
  const handleDeleteSurvey = async () => {
    const accepted = window.confirm("Are you sure you want to delete this survey?");
    if (!accepted) return;
    try {
      await deleteSurvey(id);
      toast.success("Survey deleted");
      navigate("/surveys");
    } catch (e) {
      toast.error("Error deleting survey");
      console.error(e);
    }
  };

  if (!survey) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">{survey.title}</h1>
      <p className="text-gray-700 mb-6">{survey.description}</p>

      {/* Delete Survey */}
      <button
        onClick={handleDeleteSurvey}
        className="mb-6 inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Survey
      </button>

      {/* Add Question */}
      <form onSubmit={handleAddQuestion} className="grid md:grid-cols-4 gap-2 mb-6">
        {/* Texto */}
        <input
          type="text"
          placeholder="New question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="rounded-md border px-3 py-2 md:col-span-2"
        />

        {/* Tipo */}
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="rounded-md border px-2 py-2"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Requerida */}
        <label className="inline-flex items-center gap-2 px-2 py-2">
          <input
            type="checkbox"
            checked={newRequired}
            onChange={(e) => setNewRequired(e.target.checked)}
          />
          Requerida
        </label>

        {/* Choices (solo si el tipo lo necesita) */}
        {TYPES_NEED_CHOICES.includes(newType) && (
          <input
            type="text"
            placeholder="Opciones separadas por ; (Ej: Excelente;Bueno;Regular;Malo)"
            value={newChoices}
            onChange={(e) => setNewChoices(e.target.value)}
            className="rounded-md border px-3 py-2 md:col-span-3"
          />
        )}

        {/* Botón */}
        <div className="md:col-span-4">
          <button
            type="submit"
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md"
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </button>
        </div>
      </form>

      {/* List Questions */}
      <ul className="space-y-3">
        {questions.map((q) => (
          <li
            key={q.id}
            className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md"
          >
            {editingId === q.id ? (
              <form onSubmit={handleUpdateQuestion} className="flex w-full space-x-2">
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="flex-1 rounded-md border px-2 py-1"
                />
                <select
                  value={editingType}
                  onChange={(e) => setEditingType(e.target.value)}
                  className="rounded-md border px-2 py-1"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-1 bg-green-600 text-white rounded-md"
                >
                  <Save className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <div className="flex-1">
                  <span>
                    {q.text}{" "}
                    <span className="text-xs text-gray-500">({q.question_type})</span>
                    {q.required ? (
                      <span className="text-xs text-gray-500 ml-2">· requerida</span>
                    ) : null}
                  </span>
                  {Array.isArray(q.choices) && q.choices.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Opciones: {q.choices.join(" / ")}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditQuestion(q)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SurveyDetailPage;
export { SurveyDetailPage };
