// client/src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isAuthed } from "../api/api";

export default function ProtectedRoute({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}
