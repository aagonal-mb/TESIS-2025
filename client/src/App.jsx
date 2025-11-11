import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SurveysPage from "./pages/SurveysPage";
import SurveyDetailPage from "./pages/SurveyDetailPage";
import SurveysFormPage from "./pages/SurveysFormPage"; // ← para /surveys/new
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* todo lo protegido vive dentro del layout con Sidebar */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SurveysPage />} />
          <Route path="/surveys" element={<SurveysPage />} />
          <Route path="/surveys/new" element={<SurveysFormPage />} /> {/* ← match con tu link */}
          <Route path="/surveys/:id" element={<SurveyDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
