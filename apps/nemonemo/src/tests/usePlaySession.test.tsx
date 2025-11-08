import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePlaySession } from '@/features/play/usePlaySession';
import { useGameStore } from '@/store/gameStore';
import { PlayApiProvider } from '@/features/play/PlayApiContext';
import type { AxiosInstance } from 'axios';

const { mockPost, mockPatch } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn()
}));

const wrapperFactory = (client: Pick<AxiosInstance, 'post' | 'patch' | 'get'>) =>
  ({ children }: { children: React.ReactNode }) => <PlayApiProvider client={client}>{children}</PlayApiProvider>;

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    post: mockPost,
    patch: mockPatch
  }
}));

describe('usePlaySession autosave flow', () => {
  beforeEach(() => {
    mockPost.mockResolvedValue({
      data: {
        playId: 'play-1',
        stateToken: 'token',
        expiresAt: new Date(Date.now() + 3_600_000).toISOString()
      }
    });
    mockPatch.mockResolvedValue({});
  });

  afterEach(() => {
    mockPost.mockReset();
    mockPatch.mockReset();
    act(() => {
      useGameStore.getState().reset();
    });
  });

  it('patches snapshot after grid updates and timer elapses', async () => {
    const wrapper = wrapperFactory({
      post: mockPost as unknown as AxiosInstance['post'],
      patch: mockPatch as unknown as AxiosInstance['patch'],
      get: vi.fn()
    });

    const { result } = renderHook(() => usePlaySession('puzzle-123'), { wrapper });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useGameStore.getState().session.playId).toBe('play-1'));

    act(() => {
      useGameStore.getState().loadGrid({
        id: 'puzzle-123',
        width: 2,
        height: 2,
        cells: ['blank', 'blank', 'blank', 'blank']
      });
    });

    await act(async () => {
      await result.current.forceAutosave();
    });

    await waitFor(() => expect(mockPatch).toHaveBeenCalledTimes(1));

    expect(mockPatch).toHaveBeenCalledWith('/plays/play-1/snapshot', expect.objectContaining({
      mistakes: 0,
      undoCount: 0,
      usedHints: 0,
      snapshot: expect.objectContaining({
        width: 2,
        height: 2,
        cells: ['blank', 'blank', 'blank', 'blank']
      })
    }));
  });
});
