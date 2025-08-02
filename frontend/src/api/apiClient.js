import axios from 'axios'
import config from '../config/environment'

const apiClient = axios.create({
  baseURL: config.apiBaseUrl + '/api/v1',
  timeout: config.timeouts.apiRequest,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 환경별 로깅 설정
if (config.enableDebugLogs) {
  apiClient.interceptors.request.use(request => {
    console.log('[API REQUEST]', request.method?.toUpperCase(), request.url)
    return request
  })
}

apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (will be set after login)
    // Check for admin token first, then regular user token
    const adminToken = localStorage.getItem('adminAccessToken')
    const userToken = localStorage.getItem('accessToken')
    
    const token = adminToken || userToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        try {
          console.log('[DEBUG_LOG] Attempting to refresh token due to 401 error')
          
          const { refreshToken: refreshTokenAPI } = await import('./gameApi')
          const response = await refreshTokenAPI(refreshToken)
          
          const { accessToken, refreshToken: newRefreshToken } = response
          
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          console.log('[DEBUG_LOG] Token refresh successful')
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          processQueue(null, accessToken)
          
          isRefreshing = false
          
          return apiClient(originalRequest)
          
        } catch (refreshError) {
          console.error('[DEBUG_LOG] Token refresh failed:', refreshError)
          
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('userData')
          
          processQueue(refreshError, null)
          
          isRefreshing = false
          
          window.dispatchEvent(new CustomEvent('auth:logout'))
          
          return Promise.reject(refreshError)
        }
      } else {
        console.warn('[DEBUG_LOG] No refresh token available, redirecting to login')
        
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userData')
        
        isRefreshing = false
        
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }
    
    console.error('API Error:', error.response?.data || error.message)
    
    return Promise.reject(error)
  }
)

export default apiClient