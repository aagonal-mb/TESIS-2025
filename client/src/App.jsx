// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";

import SurveysList from "./components/SurveysList.jsx";
import SurveyDetailPage from "./pages/SurveyDetailPage.jsx";
import SurveyBuilderPage from "./pages/SurveyBuilderPage.jsx";

import UsersAdminPage from "./pages/UsersAdminPage.jsx";
import AdminCreateUserPage from "./pages/AdminCreateUserPage.jsx";
import AdminSurveyResponsesPage from "./pages/AdminSurveyResponsesPage.jsx";

import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* protegidas con layout */}
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
            path="/surveys/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyBuilderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* 🔹 ACÁ VA TU PÁGINA DE ENCUESTAS RESPONDIDAS */}
          <Route
            path="/surveys/responses"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminSurveyResponsesPage />
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

          {/* usuarios admin */}
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

          <Route
            path="/admin/usuarios/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminCreateUserPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* perfil */}
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

          {/* cualquier otra cosa → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
