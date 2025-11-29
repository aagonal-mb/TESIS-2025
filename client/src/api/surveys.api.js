// client/src/api/surveys.api.js
import api from "./api";

// LISTAR todas las encuestas
export const getAllSurveys = () => api.get("surveys/surveys/");

// OBTENER una encuesta
export const getSurvey = (id) => api.get(`surveys/surveys/${id}/`);

// CREAR encuesta
export const createSurvey = (survey) => api.post("surveys/surveys/", survey);

// (Opcional, para más adelante)
export const deleteSurvey = (id) => api.delete(`surveys/surveys/${id}/`);
export const updateSurvey = (id, survey) =>
  api.put(`surveys/surveys/${id}/`, survey);
