// client/src/pages/LoginPage.jsx
import { useState } from "react";
import axios from "axios";
import { BASE, setTokens } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await axios.post(`${BASE}/auth/token/`, { username, password });
      // data: { access, refresh }
      setTokens(data);
      navigate("/surveys");   // redirige a la lista
    } catch {
      setError("Usuario o contraseña inválidos");
    }
  }

  return (
    <div className="grid place-items-center h-screen">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm grid gap-3">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <input
          className="border rounded px-3 py-2"
          placeholder="Usuario"
          value={username}
          onChange={(e)=>setU(e.target.value)}
        />

        <input
          className="border rounded px-3 py-2"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e)=>setP(e.target.value)}
        />

        <button className="bg-blue-600 text-white rounded py-2">Entrar</button>
      </form>
    </div>
  );
}
