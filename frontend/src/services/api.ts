// Unified API Service using the consolidated apiClient from /api/client.ts
import {apiClient} from '../api/client';
import type {ApiResponse} from '../types/api';

// Export unified API service
export class ApiService {
  // HTTP Methods that delegate to apiClient
  async get<T>(endpoint: string): Promise<T> {
    return apiClient.get<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return apiClient.post<T>(endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return apiClient.put<T>(endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return apiClient.delete<T>(endpoint);
  }

  // Convenience method for endpoints that return ApiResponse<T>
  async apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(endpoint);
  }

  async apiPost<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.post<ApiResponse<T>>(endpoint, data);
  }

  async apiPut<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.put<ApiResponse<T>>(endpoint, data);
  }

  async apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.delete<ApiResponse<T>>(endpoint);
  }
}

// Export singleton instance
export const apiService = new ApiService();
