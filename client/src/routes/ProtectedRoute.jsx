import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { authed, ready } = useAuth();

  // Mientras el AuthContext está chequeando el token
  if (!ready) {
    return null; // si querés, poné un loader acá
  }

  // Si no está autenticado → lo mando al login
  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado → muestro lo que me pasen como children
  return children;
}
