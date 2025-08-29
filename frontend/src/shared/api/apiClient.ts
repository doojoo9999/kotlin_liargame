import axios from 'axios';

const API_BASE_URL = 'http://119.201.53.4:20021';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 세션/쿠키를 위한 설정
});

// TODO: Add interceptors for request/response handling (e.g., auth tokens, error handling)
