// src/api/questions.api.js
import api from './api';

export const getQuestionsBySurvey = (surveyId) =>
  api.get(`surveys/${surveyId}/questions/`);

// POST crear pregunta
export const createQuestion = (surveyId, question) =>
  api.post(`surveys/${surveyId}/questions/`, question);

// DELETE eliminar pregunta
export const deleteQuestion = (surveyId, id) =>
  api.delete(`surveys/${surveyId}/questions/${id}/`);

// PUT actualizar pregunta
export const updateQuestion = (surveyId, id, question) =>
  api.put(`surveys/${surveyId}/questions/${id}/`, question);
