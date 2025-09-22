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

export function SurveyDetailPage() {
  const { id } = useParams(); // surveyId
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);

  // 🔹 Para nueva pregunta
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState("text");

  // 🔹 Para edición
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

  // Cargar encuesta + preguntas
  useEffect(() => {
    async function loadSurvey() {
      const { data } = await getSurvey(id);
      setSurvey(data);
    }
    async function loadQuestions() {
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
    }
    loadSurvey();
    loadQuestions();
  }, [id]);

  // Crear pregunta
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      await createQuestion(id, {
        text: newQuestion,
        question_type: newType,
      });
      setNewQuestion("");
      setNewType("text");
      toast.success("Question created");
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
    } catch (err) {
      toast.error("Error creating question");
      console.error(err);
    }
  };

  // Eliminar pregunta
  const handleDeleteQuestion = async (questionId) => {
    const accepted = window.confirm("Are you sure you want to delete this question?");
    if (accepted) {
      await deleteQuestion(id, questionId);
      toast.success("Question deleted");
      const { data } = await getQuestionsBySurvey(id);
      setQuestions(data);
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
    if (accepted) {
      await deleteSurvey(id);
      toast.success("Survey deleted");
      navigate("/surveys");
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
      <form onSubmit={handleAddQuestion} className="flex space-x-2 mb-6">
        <input
          type="text"
          placeholder="New question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2"
        />
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
        <button
          type="submit"
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md"
        >
          <Plus className="mr-1 h-4 w-4" /> Add
        </button>
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
                <span>
                  {q.text}{" "}
                  <span className="text-xs text-gray-500">({q.question_type})</span>
                </span>
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
