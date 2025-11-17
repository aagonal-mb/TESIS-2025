import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { authed, ready } = useAuth();
  const loc = useLocation();

  // ⛔ NO redirijas hasta conocer el estado (evita parpadeos/loops)
  if (!ready) return null;

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }
  return children;
}
