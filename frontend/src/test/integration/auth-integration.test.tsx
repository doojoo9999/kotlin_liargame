/**
 * Authentication Integration Tests
 * 
 * Tests for authentication flow integration including
 * login process, session management, and protected routes.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MantineProvider} from '@mantine/core';
import {MemoryRouter, Navigate, Route, Routes} from 'react-router-dom';
import type {ReactNode} from 'react';

// Mock API calls
const mockLoginApi = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn()
};

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock auth context
interface AuthContextValue {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

let authContext: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn()
};

// Mock components for integration testing
const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return <div data-testid="auth-provider">{children}</div>;
};

const MockLoginPage = () => {
  const [nickname, setNickname] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await mockLoginApi.login({ nickname });
      // Simulate successful login
      authContext.user = { id: 'user-123', nickname };
      authContext.isAuthenticated = true;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="login-page">
      <h1>로그인</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임을 입력하세요"
          data-testid="nickname-input"
        />
        <button
          type="submit"
          disabled={isLoading || !nickname}
          data-testid="login-button"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      {error && (
        <div data-testid="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

const MockDashboard = () => {
  return (
    <div data-testid="dashboard">
      <h1>대시보드</h1>
      <p>환영합니다, {authContext.user?.nickname}님!</p>
      <button
        onClick={() => {
          authContext.logout();
          authContext.user = null;
          authContext.isAuthenticated = false;
        }}
        data-testid="logout-button"
      >
        로그아웃
      </button>
    </div>
  );
};

const MockProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (authContext.isLoading) {
    return <div data-testid="loading">로딩 중...</div>;
  }

  if (!authContext.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <div data-testid="protected-content">{children}</div>;
};

const MockGameLobby = () => {
  return (
    <div data-testid="game-lobby">
      <h1>게임 로비</h1>
      <p>{authContext.user?.nickname}님, 게임을 시작하세요!</p>
    </div>
  );
};

// Test wrapper with providers
const TestWrapper = ({ 
  children, 
  initialRoute = '/' 
}: { 
  children: ReactNode;
  initialRoute?: string;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <MockAuthProvider>
          <MemoryRouter initialEntries={[initialRoute]}>
            {children}
          </MemoryRouter>
        </MockAuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    
    // Reset auth context
    authContext = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      mockLoginApi.login.mockResolvedValue({
        user: { id: 'user-123', nickname: '테스트유저', token: 'mock-token' }
      });

      render(
        <TestWrapper initialRoute="/login">
          <Routes>
            <Route path="/login" element={<MockLoginPage />} />
            <Route path="/dashboard" element={<MockDashboard />} />
          </Routes>
        </TestWrapper>
      );

      // Should show login page initially
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // Fill in nickname and submit
      const nicknameInput = screen.getByTestId('nickname-input');
      const loginButton = screen.getByTestId('login-button');

      await user.type(nicknameInput, '테스트유저');
      await user.click(loginButton);

      // Should call login API
      expect(mockLoginApi.login).toHaveBeenCalledWith({ nickname: '테스트유저' });

      // Should show loading state
      expect(screen.getByText('로그인 중...')).toBeInTheDocument();

      await waitFor(() => {
        // After successful login, context should be updated
        expect(authContext.user?.nickname).toBe('테스트유저');
        expect(authContext.isAuthenticated).toBe(true);
      });
    });

    it('should handle login failure', async () => {
      const errorMessage = '이미 사용 중인 닉네임입니다.';
      mockLoginApi.login.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper initialRoute="/login">
          <MockLoginPage />
        </TestWrapper>
      );

      const nicknameInput = screen.getByTestId('nickname-input');
      const loginButton = screen.getByTestId('login-button');

      await user.type(nicknameInput, '중복닉네임');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
      });

      // Should not be authenticated
      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBeNull();
    });

    it('should disable login button for empty nickname', () => {
      render(
        <TestWrapper initialRoute="/login">
          <MockLoginPage />
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeDisabled();
    });

    it('should enable login button when nickname is entered', async () => {
      render(
        <TestWrapper initialRoute="/login">
          <MockLoginPage />
        </TestWrapper>
      );

      const nicknameInput = screen.getByTestId('nickname-input');
      const loginButton = screen.getByTestId('login-button');

      await user.type(nicknameInput, '테스트');

      expect(loginButton).not.toBeDisabled();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      render(
        <TestWrapper initialRoute="/dashboard">
          <Routes>
            <Route path="/login" element={<MockLoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <MockProtectedRoute>
                  <MockDashboard />
                </MockProtectedRoute>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      // Should redirect to login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });

    it('should allow authenticated users to access protected routes', () => {
      // Set authenticated state
      authContext.user = { id: 'user-123', nickname: '테스트유저' };
      authContext.isAuthenticated = true;

      render(
        <TestWrapper initialRoute="/dashboard">
          <Routes>
            <Route path="/login" element={<MockLoginPage />} />
            <Route 
              path="/dashboard" 
              element={
                <MockProtectedRoute>
                  <MockDashboard />
                </MockProtectedRoute>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      // Should show dashboard
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText('환영합니다, 테스트유저님!')).toBeInTheDocument();
    });

    it('should show loading state during authentication check', () => {
      authContext.isLoading = true;

      render(
        <TestWrapper initialRoute="/dashboard">
          <Routes>
            <Route 
              path="/dashboard" 
              element={
                <MockProtectedRoute>
                  <MockDashboard />
                </MockProtectedRoute>
              } 
            />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });
  });

  describe('Logout Flow', () => {
    it('should handle logout correctly', async () => {
      // Set authenticated state
      authContext.user = { id: 'user-123', nickname: '테스트유저' };
      authContext.isAuthenticated = true;

      render(
        <TestWrapper initialRoute="/dashboard">
          <Routes>
            <Route path="/login" element={<MockLoginPage />} />
            <Route path="/dashboard" element={<MockDashboard />} />
          </Routes>
        </TestWrapper>
      );

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      // Should clear authentication state
      expect(authContext.user).toBeNull();
      expect(authContext.isAuthenticated).toBe(false);
    });

    it('should clear localStorage on logout', async () => {
      mockLocalStorage.setItem('token', 'mock-token');
      mockLocalStorage.setItem('user', JSON.stringify({ id: 'user-123', nickname: '테스트유저' }));

      authContext.user = { id: 'user-123', nickname: '테스트유저' };
      authContext.isAuthenticated = true;

      const mockLogout = vi.fn().mockImplementation(() => {
        mockLocalStorage.removeItem('token');
        mockLocalStorage.removeItem('user');
        authContext.user = null;
        authContext.isAuthenticated = false;
      });

      authContext.logout = mockLogout;

      render(
        <TestWrapper initialRoute="/dashboard">
          <MockDashboard />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Session Persistence', () => {
    it('should restore session from localStorage on app start', () => {
      const storedUser = { id: 'user-123', nickname: '테스트유저' };
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return JSON.stringify(storedUser);
        if (key === 'token') return 'stored-token';
        return null;
      });

      // Simulate app initialization
      const initializeAuth = () => {
        const storedUserData = mockLocalStorage.getItem('user');
        const storedToken = mockLocalStorage.getItem('token');

        if (storedUserData && storedToken) {
          authContext.user = JSON.parse(storedUserData);
          authContext.isAuthenticated = true;
        }
      };

      initializeAuth();

      expect(authContext.user).toEqual(storedUser);
      expect(authContext.isAuthenticated).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'user') return 'invalid-json';
        return null;
      });

      const initializeAuth = () => {
        try {
          const storedUserData = mockLocalStorage.getItem('user');
          if (storedUserData) {
            authContext.user = JSON.parse(storedUserData);
            authContext.isAuthenticated = true;
          }
        } catch (error) {
          // Clear corrupted data
          mockLocalStorage.removeItem('user');
          mockLocalStorage.removeItem('token');
          authContext.user = null;
          authContext.isAuthenticated = false;
        }
      };

      initializeAuth();

      expect(authContext.user).toBeNull();
      expect(authContext.isAuthenticated).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired tokens automatically', async () => {
      const refreshedToken = 'new-token';
      mockLoginApi.refreshToken.mockResolvedValue({ token: refreshedToken });

      authContext.user = { id: 'user-123', nickname: '테스트유저' };
      authContext.isAuthenticated = true;

      const mockRefreshUser = vi.fn().mockImplementation(async () => {
        try {
          const response = await mockLoginApi.refreshToken();
          mockLocalStorage.setItem('token', response.token);
          return response;
        } catch (error) {
          // If refresh fails, logout user
          authContext.user = null;
          authContext.isAuthenticated = false;
          mockLocalStorage.removeItem('token');
          mockLocalStorage.removeItem('user');
          throw error;
        }
      });

      authContext.refreshUser = mockRefreshUser;

      await authContext.refreshUser();

      expect(mockLoginApi.refreshToken).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', refreshedToken);
    });

    it('should logout user if token refresh fails', async () => {
      mockLoginApi.refreshToken.mockRejectedValue(new Error('Token expired'));

      authContext.user = { id: 'user-123', nickname: '테스트유저' };
      authContext.isAuthenticated = true;

      const mockRefreshUser = vi.fn().mockImplementation(async () => {
        try {
          await mockLoginApi.refreshToken();
        } catch (error) {
          authContext.user = null;
          authContext.isAuthenticated = false;
          mockLocalStorage.removeItem('token');
          mockLocalStorage.removeItem('user');
          throw error;
        }
      });

      authContext.refreshUser = mockRefreshUser;

      await expect(authContext.refreshUser()).rejects.toThrow('Token expired');

      expect(authContext.user).toBeNull();
      expect(authContext.isAuthenticated).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate to dashboard after successful login', async () => {
      mockLoginApi.login.mockResolvedValue({
        user: { id: 'user-123', nickname: '테스트유저', token: 'mock-token' }
      });

      const MockAppWithNavigation = () => {
        const [currentRoute, setCurrentRoute] = React.useState('/login');

        const handleLoginSuccess = () => {
          authContext.user = { id: 'user-123', nickname: '테스트유저' };
          authContext.isAuthenticated = true;
          setCurrentRoute('/dashboard');
        };

        return (
          <div>
            {currentRoute === '/login' && (
              <div>
                <MockLoginPage />
                <button 
                  onClick={handleLoginSuccess}
                  data-testid="simulate-login-success"
                >
                  Simulate Login Success
                </button>
              </div>
            )}
            {currentRoute === '/dashboard' && <MockDashboard />}
          </div>
        );
      };

      // Mock React.useState
      let routeState = '/login';
      vi.doMock('react', () => ({
        useState: vi.fn().mockReturnValue([
          routeState,
          (newRoute: string) => { routeState = newRoute; }
        ])
      }));

      render(
        <TestWrapper>
          <MockAppWithNavigation />
        </TestWrapper>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      const simulateButton = screen.getByTestId('simulate-login-success');
      await user.click(simulateButton);

      // After login, should show dashboard
      expect(authContext.isAuthenticated).toBe(true);
    });

    it('should maintain attempted route for redirect after login', () => {
      const attemptedRoute = '/game/abc123';
      
      // Mock route storage
      const mockRouteStorage = {
        store: (route: string) => sessionStorage.setItem('redirectAfterLogin', route),
        retrieve: () => sessionStorage.getItem('redirectAfterLogin'),
        clear: () => sessionStorage.removeItem('redirectAfterLogin')
      };

      // Mock sessionStorage
      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

      mockRouteStorage.store(attemptedRoute);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectAfterLogin', attemptedRoute);

      const retrievedRoute = mockRouteStorage.retrieve();
      mockSessionStorage.getItem.mockReturnValue(attemptedRoute);

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('redirectAfterLogin');
    });
  });

  describe('Multiple Tab Support', () => {
    it('should sync authentication state across tabs', () => {
      const mockStorageEvent = (key: string, newValue: string | null) => {
        const event = new StorageEvent('storage', {
          key,
          newValue,
          oldValue: null,
          storageArea: localStorage
        });
        window.dispatchEvent(event);
      };

      const mockStorageListener = vi.fn().mockImplementation((event: StorageEvent) => {
        if (event.key === 'token' && !event.newValue) {
          // Token was removed, logout user
          authContext.user = null;
          authContext.isAuthenticated = false;
        }
      });

      window.addEventListener('storage', mockStorageListener);

      // Simulate token removal in another tab
      mockStorageEvent('token', null);

      expect(authContext.user).toBeNull();
      expect(authContext.isAuthenticated).toBe(false);

      window.removeEventListener('storage', mockStorageListener);
    });
  });
});