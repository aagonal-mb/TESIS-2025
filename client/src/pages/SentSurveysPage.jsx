// client/src/pages/SentSurveysPage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function SentSurveysPage() {
  const { user } = useAuth();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const isAdmin =
    (user?.rol && user.rol.toLowerCase() === "admin") ||
    user?.is_superuser ||
    user?.isSuperuser;

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadData() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.get("surveys/surveys/");
      const list = Array.isArray(res.data) ? res.data : [];

      // Tomamos como "enviadas" las encuestas activas (status = true)
      const sent = list.filter((s) => s.status === true || s.status === "active");
      setSurveys(sent);
    } catch (e) {
      console.error(e);
      setErr("No se pudieron cargar las encuestas enviadas.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        Solo los usuarios administradores pueden ver las encuestas enviadas.
      </div>
    );
  }

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("es-AR");
    } catch {
      return iso;
    }
  };

  const filtered = surveys.filter((s) => {
    const text = `${s.title || ""} ${s.description || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 24,
          marginTop: 0,
          marginBottom: 8,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Encuestas enviadas
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Listado de encuestas activas que fueron enviadas a los colaboradores.
      </p>

      <input
        className="auth-input"
        style={{ maxWidth: 260, marginBottom: 16 }}
        placeholder="Buscar encuestas..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <div>Cargando encuestas enviadas...</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>}

      {!loading && !err && filtered.length === 0 && (
        <div>No hay encuestas enviadas que coincidan con la búsqueda.</div>
      )}

      {!loading && !err && filtered.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>
                <th style={thStyle}>Encuesta</th>
                <th style={thStyle}>Descripción</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Creada</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>{s.title}</td>
                  <td style={tdStyle}>
                    {s.description || "Sin descripción"}
                  </td>
                  <td style={tdStyle}>
                    {s.status ? "Activa" : "Borrador / Inactiva"}
                  </td>
                  <td style={tdStyle}>{formatDate(s.created_at)}</td>
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
