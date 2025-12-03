// client/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// ===================================
// Páginas Públicas
// ===================================
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

// ===================================
// Páginas de Usuario y Encuestas
// ===================================
import AppLayout from "./layouts/AppLayout";
import MePage from "./pages/MePage";
import SurveysPage from "./pages/SurveysPage.jsx"; // O el componente que uses para la lista
import SurveyDetailPage from "./pages/SurveyDetailPage.jsx";
import SurveyBuilderPage from "./pages/SurveyBuilderPage.jsx";
import SurveyAssignmentPage from "./pages/SurveyAssignmentPage.jsx"; // Para asignar encuestas
import SentSurveysPage from "./pages/SentSurveysPage.jsx"; // Encuestas enviadas

// ===================================
// Páginas de Administración y Reportes
// ===================================
import UsersAdminPage from "./pages/UsersAdminPage.jsx";
import AdminCreateUserPage from "./pages/AdminCreateUserPage.jsx";
import SurveyResponsesPage from "./pages/SurveyResponsesPage.jsx"; // Respuestas de UNA encuesta
import AdminSurveyResponsesPage from "./pages/AdminSurveyResponsesPage.jsx"; // Lista general de respuestas (opcional)
import AdminReferenceManagementPage from "./pages/AdminReferenceManagementPage.jsx"; // Gestión de Roles/Deptos
import ReportsPage from "./pages/ReportsPage.jsx"; // Reportes generales
import SurveyReportPage from "./pages/SurveyReportPage.jsx"; // Reporte visual de UNA encuesta


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* =================================== */}
          {/* RUTAS PÚBLICAS */}
          {/* =================================== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:uid/:token"
            element={<ResetPasswordPage />}
          />

          {/* =================================== */}
          {/* RUTAS PROTEGIDAS (Requieren LOGIN) */}
          {/* =================================== */}

          {/* HOME (redirige a /surveys) */}
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
          
          {/* ENCUESTAS: ENVIADAS (solo admin o creador) */}
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
          
          {/* ENCUESTAS: ASIGNAR */}
          <Route
            path="/surveys/:id/assign"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyAssignmentPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ADMIN: LISTA DE ENCUESTAS RESPONDIDAS (opcional, si es diferente a /surveys) */}
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

          {/* ADMIN/USUARIO: RESPUESTAS DE UNA ENCUESTA (URL 1: /surveys/responses/123) */}
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

          {/* ADMIN/USUARIO: RESPUESTAS DE UNA ENCUESTA (URL 2: /surveys/123/responses) */}
          <Route
            path="/surveys/:id/responses"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyResponsesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* =================================== */}
          {/* RUTAS DE ADMINISTRACIÓN */}
          {/* =================================== */}

          {/* ADMIN: GESTIÓN DE USUARIOS */}
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

          {/* ADMIN: CREAR USUARIO */}
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
          
          {/* ADMIN: GESTIÓN DE ROLES (Catálogo Genérico) */}
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminReferenceManagementPage type="roles" />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ADMIN: GESTIÓN DE DEPARTAMENTOS (Catálogo Genérico) */}
          <Route
            path="/admin/departamentos"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminReferenceManagementPage type="departamentos" />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* =================================== */}
          {/* RUTAS DE REPORTES */}
          {/* =================================== */}

          {/* REPORTES GENERALES */}
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

          {/* REPORTE DETALLADO DE UNA ENCUESTA */}
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

          {/* =================================== */}
          {/* RUTA CATCH-ALL */}
          {/* =================================== */}
          {/* Cualquier otra ruta → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}