// client/src/api/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000", // backend Django
});

// Interceptor: agrega automáticamente el access token si existe
apiClient.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

export default apiClient;
