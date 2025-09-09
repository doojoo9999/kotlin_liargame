import {apiService} from './api';
import {LoginRequest, LoginResponse, SessionRefreshResponse} from '../types/auth';
import {API_ENDPOINTS} from '../constants/apiEndpoints';

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success) {
        console.log('Login successful:', response.nickname);
      }

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      // 로그아웃 실패해도 로컬 상태는 정리
    }
  }

  async refreshSession(): Promise<SessionRefreshResponse> {
    try {
      const response = await apiService.post<SessionRefreshResponse>(
        API_ENDPOINTS.AUTH.REFRESH
      );

      if (response.success) {
        console.log('Session refresh successful:', response.nickname);
      }

      return response;
    } catch (error) {
      console.error('Session refresh failed:', error);
      throw error;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await this.refreshSession();
      return response.success;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
