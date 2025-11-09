import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore, type CellState } from '@/store/gameStore';
import { useNotificationStore } from '@/store/notificationStore';
import { usePlayApi } from './PlayApiContext';

type PlayStartResponse = {
  playId: string;
  stateToken: string;
  expiresAt: string;
};

type AutosavePayload = {
  snapshot: {
    cells: CellState[];
    width: number;
    height: number;
    mistakes: number;
    updatedAt: number | null;
  };
  mistakes: number;
  undoCount: number;
  usedHints: number;
};

export const usePlaySession = (puzzleId?: string) => {
  const { session, grid, mistakes, hintsUsed, setSession, clearSession } = useGameStore((state) => ({
    session: state.session,
    grid: state.grid,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
    setSession: state.setSession,
    clearSession: state.clearSession
  }));
  const pushToast = useNotificationStore((state) => state.pushToast);
  const httpClient = usePlayApi();

  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const updateStatus = useCallback((value: typeof status) => {
    setStatus(value);
    if (typeof window !== 'undefined') {
      (window as Window & { __PLAYWRIGHT_LAST_STATUS__?: string }).__PLAYWRIGHT_LAST_STATUS__ = value;
    }
  }, []);

  const startedForPuzzleRef = useRef<string | null>(null);
  const autosaveErrorNotifiedRef = useRef(false);
  const autosaveAbortRef = useRef(false);

  useEffect(() => {
    if (!puzzleId) {
      clearSession();
      startedForPuzzleRef.current = null;
      updateStatus('idle');
      return;
    }

    if (startedForPuzzleRef.current === puzzleId) {
      return;
    }
    startedForPuzzleRef.current = puzzleId;
    updateStatus('starting');
    clearSession();
    autosaveAbortRef.current = false;

    httpClient
      .post<PlayStartResponse>(`/puzzles/${puzzleId}/plays`, { mode: 'NORMAL' })
      .then((response) => {
        if (autosaveAbortRef.current) {
          return;
        }
        setSession(response.data);
        pushToast({
          title: '플레이 세션 시작',
          description: '자동 저장이 활성화되었습니다.'
        });
        updateStatus('ready');
      })
      .catch((error) => {
        if (autosaveAbortRef.current) {
          return;
        }
        console.error('Failed to start play session', error);
        pushToast({
          title: '세션 시작 실패',
          description: '네트워크 연결을 확인해 주세요.'
        });
        updateStatus('error');
      });
  }, [clearSession, httpClient, puzzleId, pushToast, setSession, updateStatus]);

  const autosavePayload = useMemo<AutosavePayload | null>(() => {
    if (!session.playId || grid.cells.length === 0) {
      return null;
    }
    return {
      snapshot: {
        cells: grid.cells,
        width: grid.width,
        height: grid.height,
        mistakes,
        updatedAt: grid.lastUpdated
      },
      mistakes,
      undoCount: Math.max(0, grid.history.length - 1),
      usedHints: hintsUsed
    };
  }, [grid.cells, grid.height, grid.history.length, grid.lastUpdated, grid.width, hintsUsed, mistakes, session.playId]);

  const autosave = useCallback(async () => {
    if (!session.playId || !autosavePayload) {
      return;
    }
    setAutosaveState('saving');
    try {
      await httpClient.patch(`/plays/${session.playId}/snapshot`, autosavePayload);
      autosaveErrorNotifiedRef.current = false;
      setLastSavedAt(Date.now());
      setAutosaveState('idle');
    } catch (error) {
      console.error('Autosave failed', error);
      setAutosaveState('error');
      if (!autosaveErrorNotifiedRef.current) {
        autosaveErrorNotifiedRef.current = true;
        pushToast({
          title: '자동 저장 실패',
          description: '네트워크 상태를 확인해 주세요.'
        });
      }
    }
  }, [autosavePayload, httpClient, pushToast, session.playId]);

  useEffect(() => {
    if (!session.playId || !grid.lastUpdated) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void autosave();
    }, 3000);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [autosave, grid.lastUpdated, session.playId]);

  useEffect(() => {
    if (!session.playId) {
      return;
    }
    const handleBeforeUnload = () => {
      void autosave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [autosave, session.playId]);

  useEffect(() => {
    return () => {
      autosaveAbortRef.current = true;
      startedForPuzzleRef.current = null;
      clearSession();
    };
  }, [clearSession]);

  const forceAutosave = useCallback(async () => {
    await autosave();
  }, [autosave]);

  return {
    status,
    playId: session.playId,
    autosaveState,
    lastSavedAt,
    forceAutosave
  };
};
