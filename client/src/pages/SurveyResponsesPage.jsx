// client/src/pages/SurveyResponsesPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { getSurvey } from "../api/surveys.api";
import FormattedAnswerDisplay from "../components/FormattedAnswerDisplay"; 
// ✅ IMPORTAR FUNCIONES DE OPCIONES
import { getRoles, getDepartamentos } from "../api/accounts.api"; 

export default function SurveyResponsesPage() {
  const { id } = useParams(); // id de la encuesta
  const { user } = useAuth();

  const [survey, setSurvey] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  // ✅ ESTADOS PARA FILTROS
  const [roles, setRoles] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedRol, setSelectedRol] = useState(""); // "" -> No filtrar
  const [selectedDepto, setSelectedDepto] = useState(""); // "" -> No filtrar


  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  // 💡 DEPENDENCIA ACTUALIZADA: Recargar cuando cambian los filtros o la encuesta ID
  useEffect(() => {
    loadData();
    let cancelled = false;
    return () => {
      cancelled = true;
    };
  }, [id, selectedRol, selectedDepto]); // AÑADIR FILTROS COMO DEPENDENCIAS

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      // 1. Fetch de datos y opciones
      const [surveyRes, questionsRes, answersRes, usuariosRes, rolesRes, deptosRes] =
        await Promise.all([
          getSurvey(id),
          api.get(`surveys/surveys/${id}/questions/`),
          // ✅ 2. PASAR LOS FILTROS AL BACKEND
          api.get(`surveys/answers/?survey_id=${id}&rol_id=${selectedRol}&departamento_id=${selectedDepto}`),
          api.get("accounts/usuarios/"),
          getRoles(), 
          getDepartamentos(),
        ]);

      // 3. Procesar datos
      const surveyData = surveyRes.data;
      const questions = Array.isArray(questionsRes.data) ? questionsRes.data : [];
      const answers = Array.isArray(answersRes.data) ? answersRes.data : [];
      const usuarios = Array.isArray(usuariosRes.data) ? usuariosRes.data : [];

      setRoles(rolesRes.data);
      setDepartamentos(deptosRes.data);


      // Map: preguntaId -> objeto pregunta (con question_type)
      const questionById = new Map();
      questions.forEach((q) => {
        if (q && q.id != null) {
          questionById.set(q.id, q);
        }
      });

      // Map: authUserId -> nombre lindo
      const userNameByAuthId = new Map();
      usuarios.forEach((u) => {
        const authId = u.user && u.user.id;
        if (authId == null) return;

        const fullName = `${u.nombre || ""} ${u.apellido || ""}`.trim();
        const fallback = (u.user && u.user.username) || `Usuario ${authId}`;
        const name = fullName || fallback;

        userNameByAuthId.set(authId, name);
      });

      // Armamos filas (ya filtradas por el backend)
      const tableRows = answers
        .filter((a) => questionById.has(a.question)) // Filtro de seguridad por survey ID
        .map((a) => {
          const q = questionById.get(a.question);
          const userName = userNameByAuthId.get(a.user) || `Usuario ${a.user}`;
          return {
            id: a.id,
            questionText: q.text,
            questionType: q.question_type, 
            userName,
            response: a.response,
          };
        });

      setSurvey(surveyData);
      setRows(tableRows);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las respuestas de esta encuesta.");
    } finally {
      setLoading(false);
    }
  }

  // ... (isAdmin check y estilos thStyle, tdStyle) ...

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 24 }}>
      {/* ... (Título, descripción, loading, error) ... */}
      
      {/* ✅ SELECTORES DE FILTRO */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fcfcfc' }}>
        <div className="auth-field" style={{ flexGrow: 1 }}>
          <label style={{ fontSize: 13, display: 'block', color: '#4b5563', marginBottom: 4 }}>Filtrar por Rol:</label>
          <select
            className="auth-input"
            style={{ width: '100%', fontSize: 14 }}
            value={selectedRol}
            onChange={(e) => setSelectedRol(e.target.value)}
          >
            <option value="">TODOS los Roles</option>
            {roles.map(r => (
              <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
            ))}
          </select>
        </div>

        <div className="auth-field" style={{ flexGrow: 1 }}>
          <label style={{ fontSize: 13, display: 'block', color: '#4b5563', marginBottom: 4 }}>Filtrar por Departamento:</label>
          <select
            className="auth-input"
            style={{ width: '100%', fontSize: 14 }}
            value={selectedDepto}
            onChange={(e) => setSelectedDepto(e.target.value)}
          >
            <option value="">TODOS los Departamentos</option>
            {departamentos.map(d => (
              <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_area}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* ... (Tabla de resultados) ... */}
      {!loading && !err && rows.length > 0 && (
        // ... (código de tabla con FormattedAnswerDisplay) ...
        <div
          // ... (estilos de tabla)
        >
          <table
            // ... (estilos de tabla)
          >
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>Colaborador</th>
                <th style={thStyle}>Pregunta</th>
                <th style={thStyle}>Respuesta ({rows.length} items)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderTop: "1px solid #e5e7eb" }}
                >
                  <td style={tdStyle}>{row.userName}</td>
                  <td style={tdStyle}>{row.questionText}</td>
                  <td style={tdStyle}>
                      <FormattedAnswerDisplay 
                          response={row.response} 
                          questionType={row.questionType} 
                      />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#6b7280",
  fontWeight: 600,
};

const tdStyle = {
  padding: "10px 16px",
  fontSize: 14,
  color: "#111827",
};