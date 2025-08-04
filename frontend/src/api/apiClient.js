import axios from 'axios'
import config from '../config/environment'

const apiClient = axios.create({
  baseURL: config.apiBaseUrl + '/api/v1',
  timeout: config.timeouts.apiRequest,
  withCredentials: true, // 세션 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
})

// JWT 관련 인터셉터 모두 제거
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