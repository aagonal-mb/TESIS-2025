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
 
 // 💡 Importante: El campo 'choices' debe ser un array para el AnswerItem.
 // Asumiendo que el backend te envía un string separado por ; (ej: "opt1;opt2"), 
 // lo convertimos aquí si es necesario (si Django ya lo hace, omite esta parte):
 const processedQuestions = filtered.map(q => ({
 ...q,
 // Si choices es un string y no es nulo, lo divide en un array
 choices: (typeof q.choices === 'string' && q.choices) ? q.choices.split(';') : q.choices || [],
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

 // --- Manejo de Cambios ---
 const handleChange = (questionId, value) => {
 setAnswers((prev) => ({ ...prev, [questionId]: value }));
 };

 // --- Envío del Formulario ---
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
 // ✅ CORRECCIÓN FINAL: Usamos 'response' para que coincida con el Serializer
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
 // Muestra los detalles del error para depuración
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
  <button
    type="button"
    className="auth-btn"
    style={{ maxWidth: 220, marginBottom: 20 }}
    onClick={() => nav(`/reports/surveys/${survey.id}`)}  // 👈 cambio acá
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