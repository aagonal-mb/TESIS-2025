// src/api/answers.api.js
import api from './api';

// GET respuestas de una pregunta
export const getAnswersByQuestion = (questionId) =>
  api.get(`questions/${questionId}/answers/`);
// POST crear respuesta
export const createAnswer = (answer) => api.post('answers/', answer);
// DELETE eliminar respuesta
export const deleteAnswer = (id) => api.delete(`answers/${id}/`);
export const getAllAnswers = () => api.get("surveys/answers/");