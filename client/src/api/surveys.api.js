// client/src/api/surveys.api.js
import api from "./api";

// LISTAR TODAS LAS ENCUESTAS
export const getAllSurveys = () => api.get("surveys/surveys/");

// TRAER UNA ENCUESTA POR ID
export const getSurvey = (id) => api.get(`surveys/surveys/${id}/`);

// CRUD extra (si los usás después)
export const createSurvey = (survey) => api.post("surveys/surveys/", survey);
export const deleteSurvey = (id) => api.delete(`surveys/surveys/${id}/`);
export const updateSurvey = (id, survey) =>
  api.put(`surveys/surveys/${id}/`, survey);
