import {QueryClient} from '@tanstack/react-query';

export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class BaseApiClient {
  private baseURL: string;
  private queryClient: QueryClient;

  constructor(baseURL: string, queryClient: QueryClient) {
    this.baseURL = baseURL;
    this.queryClient = queryClient;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const auth = this.getAuthHeaders();
    const merged: HeadersInit = {
      'Content-Type': 'application/json',
      ...auth,
      ...(options.headers as any || {})
    };

    const response = await fetch(url, {
      ...options,
      headers: merged,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new ApiError(response.status, errorData);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 쿼리 키 생성 도우미
  createQueryKey(resource: string, params?: Record<string, any>): string[] {
    const key = [resource];
    if (params) {
      key.push(JSON.stringify(params));
    }
    return key;
  }

  // 캐시 무효화 도우미
  invalidateQueries(resource: string): void {
    this.queryClient.invalidateQueries({ queryKey: [resource] });
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
