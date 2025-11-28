import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";
import SurveysList from "./components/SurveysList.jsx";
import SurveyDetailPage from "./pages/SurveyDetailPage.jsx";
import AppLayout from "./layouts/AppLayout";   // 👈 IMPORTANTE
import UsersAdminPage from "./pages/UsersAdminPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protegidas con layout + sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveysList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveysList />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/surveys/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <MePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
  path="/admin/usuarios"
  element={
    <ProtectedRoute>
      <AppLayout>
        <UsersAdminPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>


          {/* Cualquier cosa rara → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
