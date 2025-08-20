import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptors can be added here for handling auth tokens, etc.
// apiClient.interceptors.request.use(...)
// apiClient.interceptors.response.use(...)

export default apiClient;
