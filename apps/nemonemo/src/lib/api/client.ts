import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v2/nemonemo',
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const anonId = localStorage.getItem('anon_id');
  if (anonId) {
    config.headers = config.headers ?? {};
    config.headers['X-Subject-Key'] = anonId;
  }
  return config;
});
