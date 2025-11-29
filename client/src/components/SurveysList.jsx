import { useEffect, useState } from "react";
import { getAllSurveys } from "../api/surveys.api";
import { SurveyCard } from "./SurveyCard";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SurveysList() {
  const [surveys, setSurveys] = useState([]);
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
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];
        if (alive) setSurveys(data);
      } catch (e) {
        console.error("Error cargando encuestas", e);
        setErr(e?.response?.data?.detail || "Error cargando encuestas");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando encuestas…</div>;
  }

  if (err) {
    return (
      <div style={{ padding: 24, color: "#b91c1c" }}>
        {err}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* título + botón de nueva encuesta (solo admin) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 600, color: "#111827" }}>
          Encuestas
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

      {surveys.length === 0 ? (
        <div style={{ marginTop: 12, color: "#4b5563" }}>
          No hay encuestas.
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
          {surveys.map((survey) => (
            <li key={survey.id || survey.id_encuesta}>
              <SurveyCard survey={survey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
