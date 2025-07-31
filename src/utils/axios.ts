import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-g4qt.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include JWT in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Initialize headers if undefined
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
