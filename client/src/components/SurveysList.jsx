// client/src/components/SurveysList.jsx
import { useEffect, useState } from "react";
import { getAllSurveys } from "../api/surveys.api";
import { SurveyCard } from "./SurveyCard";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SurveysList() {
  const [allSurveys, setAllSurveys] = useState([]); // Cambié el nombre para mayor claridad
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user?.rol === "admin" ||
    user?.isSuperuser === true ||
    user?.is_superuser === true;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getAllSurveys();
        
        // Maneja respuesta simple o paginada
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];
          
        if (alive) setAllSurveys(data);

      } catch (e) {
        console.error("Error cargando encuestas", e);
        // Si hay error 401/403, el mensaje de detalle es más útil
        setErr(e?.response?.data?.detail || "Error cargando encuestas. ¿Token expirado?");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // FILTRADO: Mostrar solo activas al usuario normal, todas al administrador
  const filteredSurveys = isAdmin 
    ? allSurveys 
    : allSurveys.filter(survey => survey.status === true);


  if (loading) {
    return <div style={{ padding: 24 }}>Cargando encuestas…</div>;
  }

  if (err) {
    return (
      <div style={{ padding: 24, color: "#b91c1c" }}>
        Error: {err}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Título y botón */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#111827" }}>
          Encuestas Disponibles
        </h2>

        {isAdmin && (
          <button
            type="button"
            className="auth-btn"
            style={{ maxWidth: 200, paddingInline: 16 }}
            onClick={() => navigate("/surveys/new")}
          >
            + Nueva encuesta
          </button>
        )}
      </div>

      {filteredSurveys.length === 0 ? (
        <div style={{ marginTop: 12, color: "#4b5563" }}>
          No hay encuestas {isAdmin ? 'creadas' : 'activas'} para mostrar.
        </div>
      ) : (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
        >
          {filteredSurveys.map((survey) => (
            <li key={survey.id || survey.id_encuesta}>
              {/* 💡 SurveyCard manejará el click para navegar */}
              <SurveyCard survey={survey} isAdmin={isAdmin} /> 
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}