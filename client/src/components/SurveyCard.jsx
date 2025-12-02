import { useNavigate } from "react-router-dom";

export function SurveyCard({ survey }) {
  const navigate = useNavigate();

  // 💡 CONSOLIDACIÓN: Define una variable para la ID que puede ser 'id' o 'id_encuesta'
  const surveyId = survey?.id || survey?.id_encuesta; 

  const goDetail = () => {
    // 1. Verificar si la ID consolidada existe
    if (!surveyId) {
      console.error("Error: Survey ID no encontrado en el objeto:", survey);
      return;
    }
    // 2. Usar la ID consolidada para la navegación
    navigate(`/surveys/${surveyId}`);
  };

  return (
    <div
      onClick={goDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && goDetail()}
      style={{
        background: "#f9fafb",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #e5e7eb",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 4, color: "#111827", fontWeight: 600 }}>
        {survey.title}
      </h3>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
        {survey.description || "Sin descripción"}
      </p>
      
      {/* Opcional: Mostrar el estado para el administrador */}
      {survey.status !== undefined && (
          <span style={{ 
              fontSize: 12, 
              padding: '2px 8px', 
              borderRadius: 4, 
              background: survey.status ? '#e6ffe6' : '#ffe6e6',
              color: survey.status ? '#007f00' : '#b30000',
              marginTop: 8,
              display: 'inline-block'
          }}>
              {survey.status ? 'Activa' : 'Inactiva'}
          </span>
      )}

    </div>
  );
}