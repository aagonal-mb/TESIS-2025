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
import SurveyResponsesPage from "./pages/SurveyResponsesPage.jsx";

import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* público */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* inicio = listado de encuestas */}
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

          {/* mismo listado, pero en /surveys */}
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

          {/* crear encuestas */}
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

          {/* encuestas respondidas (tabla resumen) */}
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

          {/* detalle de respuestas de UNA encuesta */}
          <Route
            path="/admin/surveys/:id/responses"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveyResponsesPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* placeholder de encuestas enviadas (para que no rompa) */}
          <Route
            path="/surveys/sent"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <div style={{ padding: 24 }}>
                    La sección "Encuestas enviadas" está planificada para
                    próximos módulos. En esta entrega se priorizó la creación
                    y respuesta de encuestas.
                  </div>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ver detalle y responder encuesta */}
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

          {/* admin usuarios */}
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

          {/* placeholder reportes generales */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <div style={{ padding: 24 }}>
                    Módulo de reportes generales en desarrollo.
                  </div>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* mi perfil */}
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