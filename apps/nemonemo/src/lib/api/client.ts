import axios from 'axios';

declare global {
  interface Window {
    __PLAYWRIGHT_API_BASE__?: string;
  }
}

const resolveBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__PLAYWRIGHT_API_BASE__) {
    return window.__PLAYWRIGHT_API_BASE__;
  }
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v2/nemonemo';
};

export const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
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
