import axios from 'axios';

const resolvedBaseUrl =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) ||
  '/';

const API_BASE_URL = resolvedBaseUrl !== '/' ? resolvedBaseUrl.replace(/\/$/, '') : resolvedBaseUrl;

if (import.meta.env.DEV) {
  console.log('[apiClient] Using API base URL:', API_BASE_URL);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
