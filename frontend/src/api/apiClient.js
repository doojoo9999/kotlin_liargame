import axios from 'axios';

// Helper function to get a cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const rawBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || null;

function buildBaseURL() {
  // Ensure the base URL includes exactly one '/api/v1'
  let base = rawBase ? rawBase.replace(/\/+$/, '') : '/api/v1';
  if (rawBase) {
    const marker = '/api/v1';
    const idx = base.indexOf(marker);
    if (idx !== -1) {
      // Truncate to end at '/api/v1' if found anywhere in the string
      base = base.substring(0, idx + marker.length);
    } else if (base.endsWith('/api')) {
      base = base + '/v1';
    } else {
      base = base + '/api/v1';
    }
  }
  return base;
}

const apiClient = axios.create({
  baseURL: buildBaseURL(), // Ensure /api/v1 is applied exactly once
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Necessary for sending/receiving cookies
});

// Request interceptor to add CSRF token to headers
apiClient.interceptors.request.use((config) => {
  // Spring Security expects the CSRF token in the X-XSRF-TOKEN header by default.
  // It is sent by the server in a cookie, typically named XSRF-TOKEN.
  if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

// Response interceptor for centralized error handling or data shaping
apiClient.interceptors.response.use(
  (response) => response.data, // On success, return only the response data
  (error) => {
    // On failure, return the whole error object for React Query's onError to handle
    return Promise.reject(error);
  }
);

export default apiClient;
