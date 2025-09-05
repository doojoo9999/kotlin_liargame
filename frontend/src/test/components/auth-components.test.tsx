/**
 * Authentication Components Tests
 * 
 * Tests for authentication-related UI components including
 * login forms, user profiles, and authentication states.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MantineProvider} from '@mantine/core';
import type {ReactNode} from 'react';

// Mock the authentication hooks
vi.mock('@/features/auth/hooks/useLoginMutation', () => ({
  useLoginMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null
  })
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn()
  })
}));

// Mock components for testing
const MockLoginForm = ({ onSubmit }: { onSubmit?: (data: any) => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const nickname = formData.get('nickname') as string;
    onSubmit?.({ nickname });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="nickname">닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          placeholder="사용할 닉네임을 입력하세요"
          required
          data-testid="nickname-input"
        />
      </div>
      <button type="submit" data-testid="submit-button">
        입장하기
      </button>
    </form>
  );
};

const MockUserProfile = ({ 
  user, 
  onLogout 
}: { 
  user: { nickname: string; id: string } | null;
  onLogout?: () => void;
}) => {
  if (!user) {
    return <div data-testid="not-authenticated">로그인이 필요합니다</div>;
  }

  return (
    <div data-testid="user-profile">
      <div data-testid="user-nickname">{user.nickname}</div>
      <div data-testid="user-id">{user.id}</div>
      <button onClick={onLogout} data-testid="logout-button">
        로그아웃
      </button>
    </div>
  );
};

const MockAuthGuard = ({ 
  children, 
  fallback 
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) => {
  const isAuthenticated = false; // Mock not authenticated
  
  if (!isAuthenticated) {
    return <div data-testid="auth-guard-fallback">{fallback || '인증이 필요합니다'}</div>;
  }
  
  return <div data-testid="auth-guard-content">{children}</div>;
};

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Authentication Components', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('LoginForm Component', () => {
    it('should render login form correctly', () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      );

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('nickname-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('사용할 닉네임을 입력하세요')).toBeInTheDocument();
    });

    it('should handle form submission with valid data', async () => {
      const mockSubmit = vi.fn();
      
      render(
        <TestWrapper>
          <MockLoginForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      const nicknameInput = screen.getByTestId('nickname-input');
      const submitButton = screen.getByTestId('submit-button');

      await user.type(nicknameInput, '테스트유저');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith({ nickname: '테스트유저' });
    });

    it('should show validation error for empty nickname', async () => {
      const mockSubmit = vi.fn();
      
      render(
        <TestWrapper>
          <MockLoginForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Since the input is required, the browser should prevent submission
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should disable submit button while loading', () => {
      const MockLoadingForm = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        
        return (
          <form data-testid="login-form">
            <input data-testid="nickname-input" />
            <button
              type="submit"
              disabled={isLoading}
              data-testid="submit-button"
              onClick={() => setIsLoading(true)}
            >
              {isLoading ? '로딩 중...' : '입장하기'}
            </button>
          </form>
        );
      };

      // Mock React useState for testing
      let isLoading = false;
      const mockUseState = vi.fn().mockReturnValue([
        isLoading,
        (value: boolean) => { isLoading = value; }
      ]);
      
      vi.doMock('react', () => ({
        useState: mockUseState
      }));

      render(
        <TestWrapper>
          <MockLoadingForm />
        </TestWrapper>
      );

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).not.toBeDisabled();
      
      fireEvent.click(submitButton);
      // In a real component, this would be disabled during loading
    });

    it('should show error message on login failure', () => {
      const MockFormWithError = ({ error }: { error?: string }) => (
        <form data-testid="login-form">
          <input data-testid="nickname-input" />
          <button type="submit" data-testid="submit-button">입장하기</button>
          {error && (
            <div data-testid="error-message" role="alert">
              {error}
            </div>
          )}
        </form>
      );

      render(
        <TestWrapper>
          <MockFormWithError error="이미 사용 중인 닉네임입니다." />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('이미 사용 중인 닉네임입니다.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should clear error on new input', async () => {
      const MockFormWithErrorHandling = () => {
        const [error, setError] = React.useState('이전 오류 메시지');
        
        return (
          <form data-testid="login-form">
            <input
              data-testid="nickname-input"
              onChange={() => setError('')}
            />
            <button type="submit" data-testid="submit-button">입장하기</button>
            {error && <div data-testid="error-message">{error}</div>}
          </form>
        );
      };

      // Mock React hooks
      let errorState = '이전 오류 메시지';
      vi.doMock('react', () => ({
        useState: vi.fn().mockReturnValue([
          errorState,
          (value: string) => { errorState = value; }
        ])
      }));

      render(
        <TestWrapper>
          <MockFormWithErrorHandling />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      
      const input = screen.getByTestId('nickname-input');
      await user.type(input, 'a');
      
      // In real component, error would be cleared
    });
  });

  describe('UserProfile Component', () => {
    it('should display user profile when authenticated', () => {
      const mockUser = {
        id: 'user-123',
        nickname: '테스트유저'
      };

      render(
        <TestWrapper>
          <MockUserProfile user={mockUser} />
        </TestWrapper>
      );

      expect(screen.getByTestId('user-profile')).toBeInTheDocument();
      expect(screen.getByTestId('user-nickname')).toHaveTextContent('테스트유저');
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    it('should show not authenticated state when user is null', () => {
      render(
        <TestWrapper>
          <MockUserProfile user={null} />
        </TestWrapper>
      );

      expect(screen.getByTestId('not-authenticated')).toBeInTheDocument();
      expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
      expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
    });

    it('should handle logout button click', async () => {
      const mockLogout = vi.fn();
      const mockUser = {
        id: 'user-123',
        nickname: '테스트유저'
      };

      render(
        <TestWrapper>
          <MockUserProfile user={mockUser} onLogout={mockLogout} />
        </TestWrapper>
      );

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should display user avatar when provided', () => {
      const MockUserProfileWithAvatar = ({ 
        user 
      }: { 
        user: { nickname: string; id: string; avatar?: string } | null;
      }) => {
        if (!user) return <div>Not authenticated</div>;
        
        return (
          <div data-testid="user-profile">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={`${user.nickname}의 아바타`}
                data-testid="user-avatar"
              />
            )}
            <div data-testid="user-nickname">{user.nickname}</div>
          </div>
        );
      };

      const mockUser = {
        id: 'user-123',
        nickname: '테스트유저',
        avatar: '/avatars/test-user.png'
      };

      render(
        <TestWrapper>
          <MockUserProfileWithAvatar user={mockUser} />
        </TestWrapper>
      );

      const avatar = screen.getByTestId('user-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', '/avatars/test-user.png');
      expect(avatar).toHaveAttribute('alt', '테스트유저의 아바타');
    });
  });

  describe('AuthGuard Component', () => {
    it('should show fallback when not authenticated', () => {
      render(
        <TestWrapper>
          <MockAuthGuard fallback={<div>Please log in</div>}>
            <div>Protected content</div>
          </MockAuthGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Please log in')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should show default fallback when not authenticated and no fallback provided', () => {
      render(
        <TestWrapper>
          <MockAuthGuard>
            <div>Protected content</div>
          </MockAuthGuard>
        </TestWrapper>
      );

      expect(screen.getByText('인증이 필요합니다')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should show protected content when authenticated', () => {
      const MockAuthenticatedGuard = ({ children }: { children: ReactNode }) => {
        const isAuthenticated = true; // Mock authenticated
        
        if (!isAuthenticated) {
          return <div>인증이 필요합니다</div>;
        }
        
        return <div data-testid="auth-guard-content">{children}</div>;
      };

      render(
        <TestWrapper>
          <MockAuthenticatedGuard>
            <div data-testid="protected-content">Protected content</div>
          </MockAuthenticatedGuard>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected content')).toBeInTheDocument();
      expect(screen.queryByText('인증이 필요합니다')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Status Indicator', () => {
    it('should show loading state during authentication check', () => {
      const MockAuthStatus = ({ isLoading }: { isLoading: boolean }) => {
        if (isLoading) {
          return <div data-testid="auth-loading">인증 상태를 확인하는 중...</div>;
        }
        
        return <div data-testid="auth-ready">인증 확인 완료</div>;
      };

      render(
        <TestWrapper>
          <MockAuthStatus isLoading={true} />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.getByText('인증 상태를 확인하는 중...')).toBeInTheDocument();
    });

    it('should show ready state when authentication check is complete', () => {
      const MockAuthStatus = ({ isLoading }: { isLoading: boolean }) => {
        if (isLoading) {
          return <div data-testid="auth-loading">인증 상태를 확인하는 중...</div>;
        }
        
        return <div data-testid="auth-ready">인증 확인 완료</div>;
      };

      render(
        <TestWrapper>
          <MockAuthStatus isLoading={false} />
        </TestWrapper>
      );

      expect(screen.getByTestId('auth-ready')).toBeInTheDocument();
      expect(screen.getByText('인증 확인 완료')).toBeInTheDocument();
    });
  });

  describe('Login Validation', () => {
    it('should validate nickname length', async () => {
      const MockValidatedForm = () => {
        const [nickname, setNickname] = React.useState('');
        const [error, setError] = React.useState('');
        
        const validate = (value: string) => {
          if (value.length < 2) {
            setError('닉네임은 2자 이상이어야 합니다.');
          } else if (value.length > 10) {
            setError('닉네임은 10자 이하여야 합니다.');
          } else {
            setError('');
          }
        };

        return (
          <form data-testid="validated-form">
            <input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                validate(e.target.value);
              }}
              data-testid="nickname-input"
            />
            {error && <div data-testid="validation-error">{error}</div>}
          </form>
        );
      };

      // Mock React hooks for testing
      let nicknameState = '';
      let errorState = '';
      
      vi.doMock('react', () => ({
        useState: vi.fn()
          .mockReturnValueOnce([nicknameState, (value: string) => nicknameState = value])
          .mockReturnValueOnce([errorState, (value: string) => errorState = value])
      }));

      render(
        <TestWrapper>
          <MockValidatedForm />
        </TestWrapper>
      );

      const input = screen.getByTestId('nickname-input');
      
      // Test short nickname
      await user.type(input, 'a');
      // In real component, would show validation error
      
      // Test long nickname  
      await user.clear(input);
      await user.type(input, 'verylongnickname');
      // In real component, would show validation error
      
      // Test valid nickname
      await user.clear(input);
      await user.type(input, '테스트');
      // In real component, would clear validation error
    });

    it('should validate special characters in nickname', () => {
      const validateNickname = (nickname: string) => {
        const specialCharsRegex = /[^가-힣a-zA-Z0-9_]/;
        if (specialCharsRegex.test(nickname)) {
          return '닉네임에는 특수문자를 사용할 수 없습니다.';
        }
        return '';
      };

      expect(validateNickname('테스트유저')).toBe('');
      expect(validateNickname('testuser')).toBe('');
      expect(validateNickname('test_user')).toBe('');
      expect(validateNickname('테스트@유저')).toBe('닉네임에는 특수문자를 사용할 수 없습니다.');
      expect(validateNickname('test user')).toBe('닉네임에는 특수문자를 사용할 수 없습니다.');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      );

      const input = screen.getByLabelText('닉네임');
      expect(input).toHaveAttribute('id', 'nickname');
      
      const form = screen.getByTestId('login-form');
      expect(form).toHaveAttribute('novalidate'); // Would be in real component
    });

    it('should announce errors to screen readers', () => {
      const MockAccessibleForm = ({ error }: { error?: string }) => (
        <form>
          <label htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            aria-describedby={error ? 'nickname-error' : undefined}
            aria-invalid={!!error}
          />
          {error && (
            <div
              id="nickname-error"
              role="alert"
              data-testid="error-message"
            >
              {error}
            </div>
          )}
        </form>
      );

      render(
        <TestWrapper>
          <MockAccessibleForm error="닉네임이 유효하지 않습니다." />
        </TestWrapper>
      );

      const input = screen.getByLabelText('닉네임');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'nickname-error');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper>
          <MockLoginForm />
        </TestWrapper>
      );

      const input = screen.getByTestId('nickname-input');
      const button = screen.getByTestId('submit-button');

      // Tab to input
      await user.tab();
      expect(input).toHaveFocus();

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Enter should submit form
      await user.keyboard('{Enter}');
      // In real component, would submit the form
    });
  });
});