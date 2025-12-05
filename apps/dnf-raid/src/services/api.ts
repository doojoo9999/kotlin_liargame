import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api/dnf";

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.userFriendlyMessage ??
      error?.response?.data?.message ??
      error.message;
    return Promise.reject(new Error(message));
  }
);
