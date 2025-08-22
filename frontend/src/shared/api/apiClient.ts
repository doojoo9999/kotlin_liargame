import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 세션/쿠키를 위한 설정
});

// TODO: Add interceptors for request/response handling (e.g., auth tokens, error handling)
