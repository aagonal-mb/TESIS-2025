// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MePage from "./pages/MePage";

import SurveysPage from "./pages/SurveysPage.jsx";
import SurveyDetailPage from "./pages/SurveyDetailPage.jsx";
import SurveyBuilderPage from "./pages/SurveyBuilderPage.jsx";

import UsersAdminPage from "./pages/UsersAdminPage.jsx";
import AdminCreateUserPage from "./pages/AdminCreateUserPage.jsx";
import AdminSurveyResponsesPage from "./pages/AdminSurveyResponsesPage.jsx";
import SurveyResponsesPage from "./pages/SurveyResponsesPage.jsx";

import AppLayout from "./layouts/AppLayout";

import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SurveyReportPage from "./pages/SurveyReportPage.jsx";
import SentSurveysPage from "./pages/SentSurveysPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PÚBLICAS */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:uid/:token"
            element={<ResetPasswordPage />}
          />

          {/* HOME → redirige a /surveys dentro del layout protegido */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Navigate to="/surveys" replace />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* PERFIL */}
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

          {/* ENCUESTAS: LISTA */}
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveysPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ENCUESTAS: CREAR */}
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

          {/* ENCUESTAS: DETALLE / RESPONDER */}
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

          {/* ADMIN: LISTA DE ENCUESTAS RESPONDIDAS */}
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

          {/* ADMIN: RESPUESTAS DE UNA ENCUESTA */}
<Route
  path="/surveys/responses/:id"
  element={
    <ProtectedRoute>
      <AppLayout>
        <SurveyResponsesPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/surveys/:id/responses"   // 👈 segunda forma de URL
  element={
    <ProtectedRoute>
      <AppLayout>
        <SurveyResponsesPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>

{/* ENCUESTAS: ENVIADAS (solo admin) */}
<Route
  path="/surveys/sent"
  element={
    <ProtectedRoute>
      <AppLayout>
        <SentSurveysPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>


          {/* USUARIOS – ADMIN */}
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
            path="/admin/usuarios/new"  // 👈 coincide con el NavLink "Crear usuario"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminCreateUserPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* REPORTES */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/surveys/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyReportPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* CUALQUIER OTRA RUTA → LOGIN */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
