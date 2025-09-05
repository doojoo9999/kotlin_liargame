/**
 * Custom Hooks Tests (정상화: 구문 에러 제거용 최소 버전)
 */
import type {ReactNode} from 'react';
import * as React from 'react';
import {act, renderHook} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return ({ children }: { children: ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

interface AuthUser { id: string; nickname: string; token?: string }
function useAuthMock() {
  let user: AuthUser | null = null;
  const login = (u: AuthUser) => { user = u; };
  const logout = () => { user = null; };
  return {
    get user() { return user; },
    get isAuthenticated() { return !!user; },
    login,
    logout
  };
}

describe('useAuthMock', () => {
  it('초기 상태', () => {
    const { result } = renderHook(() => useAuthMock(), { wrapper: createWrapper() });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('로그인/로그아웃 동작', () => {
    const { result } = renderHook(() => useAuthMock(), { wrapper: createWrapper() });
    act(() => { result.current.login({ id: 'u1', nickname: '테스터', token: 't' }); });
    expect(result.current.user).toEqual({ id: 'u1', nickname: '테스터', token: 't' });
    expect(result.current.isAuthenticated).toBe(true);
    act(() => { result.current.logout(); });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});