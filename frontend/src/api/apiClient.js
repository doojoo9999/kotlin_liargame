import axios from 'axios'

/**
 * API Client configuration for Liar Game backend
 * Handles base URL configuration, authentication headers, and common request/response interceptors
 */

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor to add authentication token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (will be set after login)
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor to handle common response scenarios
 */
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('accessToken')
      // In a real app, you might want to redirect to login page here
      console.warn('Authentication failed. Please login again.')
    }
    
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message)
    
    return Promise.reject(error)
  }
)

export default apiClient