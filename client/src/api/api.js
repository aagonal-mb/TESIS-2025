// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',  // 👈 apuntamos a api/v1
});

export default api;
