import { useAuth } from "../context/AuthContext";

export default function MePage() {
  const { user, signOut } = useAuth();
  return (
    <div style={{maxWidth:600, margin:"2rem auto"}}>
      <h2>Mi perfil</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  );
}
