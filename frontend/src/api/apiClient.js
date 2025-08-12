import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Vite proxy에서 설정한 경로
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 세션 쿠키를 주고받기 위해 설정
});

// 요청 인터셉터 (필요시 토큰 등 추가)
apiClient.interceptors.request.use((config) => {
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

// 응답 인터셉터 (에러 처리 등)
apiClient.interceptors.response.use(
  (response) => response.data, // 성공 시 response.data만 반환
  (error) => {
    // 실패 시 에러 객체를 그대로 반환하여 React Query의 onError에서 처리
    return Promise.reject(error);
  }
);

export default apiClient;
