import { useEffect, useState } from "react";
import { getAllSurveys } from "../api/surveys.api";
import { SurveyCard } from "./SurveyCard"; // mantené este import como lo tenías

// 👇 ahora exporta por DEFAULT (antes era export nombrado)
export default function SurveysList() {
  const [surveys, setSurveys] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getAllSurveys();
        const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
        if (alive) setSurveys(data);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.detail || "Error cargando encuestas");
      }
    })();
    return () => { alive = false; };
  }, []);

  if (err) return <div style={{ padding: 24, color: "#fca5a5" }}>{err}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h2>Encuestas</h2>
      {surveys.length === 0 ? (
        <div>No hay encuestas.</div>
      ) : (
        <ul style={{ display: "grid", gap: 8, marginTop: 12 }}>
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
