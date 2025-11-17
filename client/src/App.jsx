import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";
import SurveysList from "./components/SurveysList.jsx"; // ahora existe export default

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <SurveysList />
              </ProtectedRoute>
            }
          />

          {/* cualquier otra ruta → inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
