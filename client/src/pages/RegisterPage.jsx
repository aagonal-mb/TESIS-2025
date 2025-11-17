import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth.api";
import AuthLayout from "../components/AuthLayout";

export default function RegisterPage() {
  const [username,setU]=useState(""); const [email,setE]=useState(""); const [password,setP]=useState("");
  const [msg,setMsg]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault(); setErr(""); setMsg(""); setLoading(true);
    try { await register({ username, email, password }); setMsg("Registro enviado. Un admin debe aprobar tu cuenta."); setTimeout(()=>nav("/login"),1300); }
    catch(e){ setErr(e?.response?.data?.detail || "Error al registrar"); }
    finally{ setLoading(false); }
  };

  return (
    <AuthLayout title="Crear cuenta" footer={<span>¿Ya tenés? <Link className="auth-link" to="/login">Iniciá sesión</Link></span>}>
      <form onSubmit={onSubmit}>
        <div className="auth-field"><label>Usuario</label>
          <input className="auth-input" value={username} onChange={e=>setU(e.target.value)} />
        </div>
        <div className="auth-field"><label>Email</label>
          <input className="auth-input" value={email} onChange={e=>setE(e.target.value)} />
        </div>
        <div className="auth-field"><label>Contraseña</label>
          <input className="auth-input" type="password" value={password} onChange={e=>setP(e.target.value)} />
        </div>
        {err && <div className="auth-error">{err}</div>}
        {msg && <div className="auth-success">{msg}</div>}
        <button className="auth-btn" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
      </form>
    </AuthLayout>
  );
}
