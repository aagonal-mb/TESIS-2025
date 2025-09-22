// src/api/surveys.api.js
import api from './api';

export const getAllSurveys = () => api.get('surveys');
export const getSurvey = (id) => api.get(`surveys/${id}/`);
export const createSurvey = (survey) => api.post('surveys/', survey);
export const deleteSurvey = (id) => api.delete(`surveys/${id}/`);
export const updateSurvey = (id, survey) => api.put(`surveys/${id}/`, survey);
