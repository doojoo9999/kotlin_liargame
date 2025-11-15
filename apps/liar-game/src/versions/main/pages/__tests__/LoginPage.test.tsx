import React from 'react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@/test/utils/test-utils';
import {MainLoginPage} from '../LoginPage';

const mockNavigate = vi.fn();
const toastMock = vi.fn();
const authStoreState = {
  isAuthenticated: false,
  login: vi.fn(),
};
const mockValidateNickname = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: undefined }),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({children, ...props}: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => authStoreState,
}));

vi.mock('@/utils/nicknameValidation', () => ({
  validateNickname: (...args: [string]) => mockValidateNickname(...args),
}));

describe('MainLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreState.isAuthenticated = false;
    authStoreState.login = vi.fn().mockResolvedValue(undefined);
    mockNavigate.mockReset();
    toastMock.mockReset();
    mockValidateNickname.mockImplementation((value: string) => ({
      isValid: true,
      normalizedNickname: value.trim(),
    }));
  });

  it('shows validation error when nickname is invalid', async () => {
    mockValidateNickname.mockImplementation(() => ({ isValid: false, error: '닉네임 오류' }));

    const user = userEvent.setup();
    render(<MainLoginPage />);

    const input = screen.getByLabelText('닉네임');
    await user.type(input, 'a');

    expect(screen.getByText('닉네임 오류')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '게임 시작' })).toBeDisabled();
  });

  it('submits nickname and navigates on success', async () => {
    const user = userEvent.setup();
    render(<MainLoginPage />);

    const input = screen.getByLabelText('닉네임');
    await user.type(input, '테스터');

    const submitButton = screen.getByRole('button', { name: '게임 시작' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authStoreState.login).toHaveBeenCalledWith('테스터');
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: '접속 성공' }));
    expect(mockNavigate).toHaveBeenCalledWith('/lobby', { replace: true });
  });
});
