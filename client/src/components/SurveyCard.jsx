import { useNavigate } from "react-router-dom";

export function SurveyCard({ survey }) {
  const navigate = useNavigate();

  const goDetail = () => {
    if (!survey?.id) return;
    navigate(`/surveys/${survey.id}`);
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
    </div>
  );
}
