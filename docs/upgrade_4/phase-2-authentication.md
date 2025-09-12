# Phase 2: Authentication System

## 목표
백엔드 API와 연동하는 세션 기반 인증 시스템을 구현합니다. 기존의 단순한 로그인을 패스워드 기반 인증으로 업그레이드합니다.

## 전제 조건
- Phase 1 (API Infrastructure) 완료
- 백엔드 인증 API가 정상 동작 (`/api/v1/auth/*`)

## 주요 작업

### 1. 인증 관련 타입 정의

**파일**: `src/types/auth.ts`

```typescript
// 로그인 요청
export interface LoginRequest {
  nickname: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  success: boolean;
  userId: number;
  nickname: string;
}

// 세션 갱신 응답
export interface SessionRefreshResponse {
  success: boolean;
  userId: number;
  nickname: string;
  message?: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  nickname: string | null;
  login: (nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

### 2. 인증 서비스 구현

**파일**: `src/services/authService.ts`

```typescript
import { apiService } from './api';
import { LoginRequest, LoginResponse, SessionRefreshResponse } from '../types/auth';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

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
```

### 3. 인증 스토어 수정

**파일**: `src/stores/authStore.ts` (기존 파일 수정)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { AuthState } from '../types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      nickname: null,

      login: async (nickname: string, password: string) => {
        try {
          const response = await authService.login({ nickname, password });
          
          if (response.success) {
            set({
              isAuthenticated: true,
              userId: response.userId,
              nickname: response.nickname,
            });
            console.log('Auth state updated:', response.nickname);
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
          console.error('Login error in store:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
          console.log('Auth state cleared');
        }
      },

      checkAuth: async () => {
        try {
          const response = await authService.refreshSession();
          
          if (response.success) {
            set({
              isAuthenticated: true,
              userId: response.userId,
              nickname: response.nickname,
            });
            console.log('Auth check successful:', response.nickname);
          } else {
            throw new Error('Session invalid');
          }
        } catch (error) {
          set({
            isAuthenticated: false,
            userId: null,
            nickname: null,
          });
          console.log('Auth check failed, cleared state');
        }
      },
    }),
    {
      name: 'auth-storage',
      // 민감한 정보는 저장하지 않음
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        nickname: state.nickname,
      }),
    }
  )
);
```

### 4. 보호된 라우팅 컴포넌트

**파일**: `src/components/auth/ProtectedRoute.tsx` (기존 파일 수정)

```typescript
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.log('Auth verification failed');
      } finally {
        setIsChecking(false);
      }
    };

    if (!isAuthenticated) {
      verifyAuth();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, checkAuth]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### 5. 로그인 페이지 수정

**파일**: `src/versions/main/pages/LoginPage.tsx` (기존 파일 수정)

```typescript
import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuthStore();
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 인증된 경우 리다이렉트
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/lobby';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast({
        title: "닉네임 입력 오류",
        description: "닉네임을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: "패스워드 입력 오류", 
        description: "패스워드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await login(nickname.trim(), password);
      
      toast({
        title: "로그인 성공",
        description: `${nickname}님, 환영합니다!`,
      });

      const from = location.state?.from?.pathname || '/lobby';
      navigate(from, { replace: true });
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        title: "로그인 실패",
        description: error.message || "로그인에 실패했습니다. 닉네임과 패스워드를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">라이어 게임</CardTitle>
          <CardDescription className="text-center">
            닉네임과 패스워드를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">패스워드</Label>
              <Input
                id="password"
                type="password"
                placeholder="패스워드를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>테스트 계정을 사용하시거나</p>
            <p>새로운 닉네임과 패스워드로 가입하세요</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6. 앱 초기화 시 인증 상태 확인

**파일**: `src/App.tsx` (기존 파일 수정)

```typescript
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
// ... 기타 imports

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.log('Initial auth check failed');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* 기존 라우터 설정 */}
    </BrowserRouter>
  );
}

export default App;
```

### 7. 테스트 파일

**파일**: `src/services/__tests__/authService.test.ts`

```typescript
import { authService } from '../authService';
import { apiService } from '../api';

jest.mock('../api');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      success: true,
      userId: 1,
      nickname: 'testUser',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      nickname: 'testUser',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse);
    expect(apiService.post).toHaveBeenCalledWith('/auth/login', {
      nickname: 'testUser',
      password: 'password123',
    });
  });

  it('should refresh session successfully', async () => {
    const mockResponse = {
      success: true,
      userId: 1,
      nickname: 'testUser',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.refreshSession();

    expect(result).toEqual(mockResponse);
    expect(apiService.post).toHaveBeenCalledWith('/auth/refresh-session');
  });

  it('should handle logout', async () => {
    (apiService.post as jest.Mock).mockResolvedValue({});

    await authService.logout();

    expect(apiService.post).toHaveBeenCalledWith('/auth/logout');
  });
});
```

## 검증 체크리스트

### ✅ 파일 생성/수정 확인
- [ ] `src/types/auth.ts` (신규)
- [ ] `src/services/authService.ts` (신규)
- [ ] `src/stores/authStore.ts` (수정)
- [ ] `src/components/auth/ProtectedRoute.tsx` (수정)
- [ ] `src/versions/main/pages/LoginPage.tsx` (수정)
- [ ] `src/App.tsx` (수정)
- [ ] `src/services/__tests__/authService.test.ts` (신규)

### ✅ 기능 테스트

1. **로그인 테스트**
   - 올바른 닉네임/패스워드로 로그인 시도
   - 잘못된 정보로 로그인 시도
   - 빈 필드로 로그인 시도

2. **세션 관리 테스트**
   - 페이지 새로고침 후 로그인 상태 유지
   - 세션 만료 후 자동 로그아웃
   - 로그아웃 기능

3. **보호된 라우팅 테스트**
   - 미인증 상태에서 보호된 페이지 접근
   - 인증 후 원래 페이지로 리다이렉트

## 예상 문제점 및 해결방법

### 문제 1: 세션 쿠키 문제
```
Credentials 없이 요청이 전송됨
```
**해결**: `withCredentials: true` 설정 확인, 백엔드 CORS 설정 확인

### 문제 2: 무한 리다이렉트
```
Login page keeps redirecting
```
**해결**: 인증 상태 확인 로직의 무한 루프 방지, `isChecking` 상태 활용

### 문제 3: TypeScript 오류
```
Type 'string | null' is not assignable to type 'string'
```
**해결**: null 체크 추가, 옵셔널 체이닝 사용

## 성공 기준

Phase 2가 성공적으로 완료되면:
- ✅ 닉네임/패스워드로 로그인 가능
- ✅ 세션이 유지되고 자동 갱신됨
- ✅ 로그아웃이 정상 동작함
- ✅ 보호된 라우팅이 동작함
- ✅ 페이지 새로고림 후에도 인증 상태 유지

다음 단계 (Phase 3: Game Management APIs)를 진행할 수 있습니다.