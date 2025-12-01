// client/src/pages/MePage.jsx
import { useEffect, useState } from "react";
import api from "../api/api";

export default function MePage() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [passErr, setPassErr] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setErr("");
      setLoading(true);
      try {
        const res = await api.get("accounts/usuarios/me/");
        if (!cancelled) {
          setPerfil(res.data);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setErr("No se pudo cargar la información de tu perfil.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPassErr("");
    setPassMsg("");

    if (!currentPass || !newPass || !newPass2) {
      setPassErr("Completá todos los campos.");
      return;
    }

    if (newPass !== newPass2) {
      setPassErr("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (newPass.length < 6) {
      setPassErr("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.post("/auth/change-password/", {
        current_password: currentPass,
        new_password: newPass,
      });
      setPassMsg(res.data?.detail || "Contraseña actualizada correctamente.");
      setCurrentPass("");
      setNewPass("");
      setNewPass2("");
    } catch (e) {
      console.error(e);
      const detail = e?.response?.data?.detail;
      setPassErr(detail || "No se pudo actualizar la contraseña.");
    } finally {
      setPassLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1
        style={{
          fontSize: 24,
          margin: 0,
          marginBottom: 16,
          fontWeight: 700,
          color: "#111827",
        }}
      >
        Mi perfil
      </h1>

      {loading && <div>Cargando datos...</div>}
      {err && <div style={{ color: "#dc2626", marginBottom: 12 }}>{err}</div>}

      {!loading && perfil && (
        <>
          {/* Datos personales */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 16,
              marginBottom: 24,
              background: "#ffffff",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                marginTop: 0,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Datos personales y laborales
            </h2>

            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                rowGap: 8,
                columnGap: 24,
                margin: 0,
              }}
            >
              <InfoRow label="Nombre" value={perfil.nombre || "-"} />
              <InfoRow label="Apellido" value={perfil.apellido || "-"} />
              <InfoRow label="Correo" value={perfil.correo || "-"} />
              <InfoRow
                label="Departamento"
                value={
                  perfil.id_departamento_data?.nombre_departamento || "-"
                }
              />
              <InfoRow
                label="Rol"
                value={perfil.id_rol_data?.nombre_rol || "-"}
              />
              <InfoRow label="Puesto" value={perfil.puesto || "-"} />
            </dl>
          </div>

          {/* Cambio de contraseña */}
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 16,
              background: "#ffffff",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                marginTop: 0,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Cambiar contraseña
            </h2>

            {passErr && (
              <div style={{ color: "#dc2626", marginBottom: 8 }}>
                {passErr}
              </div>
            )}
            {passMsg && (
              <div style={{ color: "#16a34a", marginBottom: 8 }}>
                {passMsg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="auth-field">
                <label>Contraseña actual</label>
                <input
                  className="auth-input"
                  type="password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Nueva contraseña</label>
                <input
                  className="auth-input"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label>Repetir nueva contraseña</label>
                <input
                  className="auth-input"
                  type="password"
                  value={newPass2}
                  onChange={(e) => setNewPass2(e.target.value)}
                />
              </div>

              <button
                className="auth-btn"
                type="submit"
                disabled={passLoading}
                style={{ maxWidth: 260 }}
              >
                {passLoading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <>
      <dt style={{ fontSize: 13, color: "#6b7280" }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 14, color: "#111827" }}>{value}</dd>
    </>
  );
}
