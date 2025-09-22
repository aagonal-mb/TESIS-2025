import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { SurveysPage } from "./pages/SurveysPage";
import { SurveysFormPage } from "./pages/SurveysFormPage";
import { SurveyDetailPage } from "./pages/SurveyDetailPage"; // 👈 import nuevo
import Sidebar from "./components/Sidebar";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-6 bg-white overflow-y-auto">
          <Routes>
            <Route path="/surveys" element={<SurveysPage />} />
            <Route path="/surveys/new" element={<SurveysFormPage />} />
            <Route path="/surveys/:id" element={<SurveyDetailPage />} /> {/* 👈 detalle */}
            <Route path="/surveys/:id/edit" element={<SurveysFormPage />} /> {/* 👈 edición */}
            <Route path="*" element={<Navigate to="/surveys" />} />
            
          </Routes>
        </div>
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
