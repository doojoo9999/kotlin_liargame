import axios from 'axios'

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://119.201.51.128:20021') + '/api/v1',
  timeout: 10000,
  withCredentials: true, // 세션 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Authorization if token exists (non-breaking)
apiClient.interceptors.request.use((request) => {
  try {
    // Support either a plain authToken or a token within userData
    const rawToken = localStorage.getItem('authToken')
    let token = rawToken
    if (!token) {
      const userDataRaw = localStorage.getItem('userData')
      if (userDataRaw) {
        const parsed = JSON.parse(userDataRaw)
        if (parsed && parsed.token) token = parsed.token
      }
    }
    if (token && !request.headers?.Authorization) {
      request.headers = request.headers || {}
      request.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    // no-op: do not break request flow on parsing errors
  }
  return request
})

// Response interceptor: centralize 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 단순하게 로그인 페이지로 리다이렉트
      localStorage.removeItem('userData')
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

export default apiClient