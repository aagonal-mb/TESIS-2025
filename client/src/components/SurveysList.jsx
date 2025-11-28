import { useEffect, useState } from "react";
import { getAllSurveys } from "../api/surveys.api";
import { SurveyCard } from "./SurveyCard";

export default function SurveysList() {
  const [surveys, setSurveys] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await getAllSurveys();
        console.log("ENCUESTAS DESDE BACK:", res.data);
        if (!alive) return;

        // res.data ahora es un array tipo:
        // [ { id: 1, title: "...", description: "..." }, ... ]
        setSurveys(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        if (alive) {
          setErr(e?.response?.data?.detail || "Error cargando encuestas");
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <div style={{ padding: 24, color: "#b91c1c" }}>
        Error: {err}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ fontSize: "1.4rem", marginBottom: "1rem", color: "#111827" }}>
        Encuestas
      </h2>

      {surveys.length === 0 ? (
        <div style={{ color: "#6b7280" }}>No hay encuestas.</div>
      ) : (
        <ul style={{ display: "grid", gap: 12, marginTop: 12 }}>
          {surveys.map((survey) => (
            <li key={survey.id}>
              <SurveyCard survey={survey} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
