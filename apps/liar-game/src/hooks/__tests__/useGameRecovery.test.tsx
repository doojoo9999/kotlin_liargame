import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useGameRecovery} from '@/hooks/useGameRecovery';
import {useConnectionStore} from '@/stores/connectionStore';
import {useGameStore} from '@/stores';
import {useGameplayStore} from '@/stores/gameplayStore';
import type {GameStateResponse} from '@/types/contracts/gameplay';

const mocks = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
  emitMock: vi.fn(),
  getGameStateMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
    warning: mocks.toastWarning,
  },
}));

vi.mock('@/services/gameMonitoring', () => ({
  gameMonitoring: {
    emit: mocks.emitMock,
  },
}));

vi.mock('@/api/gameApi', () => ({
  gameService: {
    getGameState: mocks.getGameStateMock,
  },
}));

describe('useGameRecovery', () => {
  const connectionInitialState = useConnectionStore.getState();
  const gameInitialState = useGameStore.getState();
  const gameplayInitialState = useGameplayStore.getState();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getGameStateMock.mockReset();
    act(() => {
      useConnectionStore.setState(connectionInitialState, true);
      useGameStore.setState(gameInitialState, true);
      useGameplayStore.setState(gameplayInitialState, true);
    });
  });

  it('synchronizes game state after reconnecting', async () => {
    const updateFromGameState = vi.fn();
    const loadChatHistory = vi.fn().mockResolvedValue([]);
    const hydrateFromSnapshot = vi.fn();

    const snapshot: GameStateResponse = {
      gameNumber: 314,
      gameName: '테스트 방',
      gameOwner: '호스트',
      gameParticipants: 3,
      gameCurrentRound: 1,
      gameTotalRounds: 3,
      gameLiarCount: 1,
      gameMode: 'LIARS_KNOW',
      gameState: 'IN_PROGRESS',
      players: [
        {
          id: 1,
          userId: 1,
          nickname: '플레이어1',
          isAlive: true,
          isOnline: true,
          lastActiveAt: new Date().toISOString(),
          state: 'WAITING_FOR_HINT',
          hasVoted: false,
        },
      ],
      currentPhase: 'SPEECH',
      isChatAvailable: true,
      targetPoints: 10,
      scoreboard: [
        {
          userId: 1,
          nickname: '플레이어1',
          isAlive: true,
          score: 0,
        },
      ],
      schemaVersion: 'game-flow/2024-09-18',
    };

    mocks.getGameStateMock.mockResolvedValue(snapshot);

    act(() => {
      useGameStore.setState({
        gameNumber: snapshot.gameNumber,
        updateFromGameState,
        loadChatHistory,
      }, false);

      useGameplayStore.setState((state) => ({
        ...state,
        actions: {
          ...state.actions,
          hydrateFromSnapshot,
        },
      }));

      useConnectionStore.setState((state) => ({
        ...state,
        status: 'disconnected',
        messageQueue: [],
        pendingMessages: {},
        syncIssues: [],
        avgLatency: undefined,
      }));
    });

    renderHook(() => useGameRecovery());

    await act(async () => {
      useConnectionStore.setState({ status: 'connected' });
    });

    await waitFor(() => {
      expect(updateFromGameState).toHaveBeenCalledWith(snapshot);
      expect(hydrateFromSnapshot).toHaveBeenCalledWith(snapshot);
    });

    expect(mocks.getGameStateMock).toHaveBeenCalledWith(snapshot.gameNumber);
    expect(loadChatHistory).toHaveBeenCalledWith(50);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('게임 상태가 복원되었습니다', expect.any(Object));

    const emittedTypes = mocks.emitMock.mock.calls.map(([arg]) => arg.type);
    expect(emittedTypes).toContain('CONNECTION_RESTORED');
    expect(emittedTypes).toContain('RECOVERY_SUCCEEDED');
  });
});
