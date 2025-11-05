import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useGameStore } from '@/store/gameStore';
import { useNotificationStore } from '@/store/notificationStore';

type PlayStartResponse = {
  playId: string;
  stateToken: string;
  expiresAt: string;
};

type AutosavePayload = {
  progress: Record<string, unknown>;
  timestamp: string;
};

export const usePlaySession = (puzzleId?: string) => {
  const { session, grid, mistakes, setSession, clearSession } = useGameStore((state) => ({
    session: state.session,
    grid: state.grid,
    mistakes: state.mistakes,
    setSession: state.setSession,
    clearSession: state.clearSession
  }));
  const pushToast = useNotificationStore((state) => state.pushToast);

  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'error'>('idle');
  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const startedForPuzzleRef = useRef<string | null>(null);
  const autosaveErrorNotifiedRef = useRef(false);
  const autosaveAbortRef = useRef(false);

  useEffect(() => {
    if (!puzzleId) {
      clearSession();
      startedForPuzzleRef.current = null;
      setStatus('idle');
      return;
    }

    if (startedForPuzzleRef.current === puzzleId) {
      return;
    }
    startedForPuzzleRef.current = puzzleId;
    setStatus('starting');
    clearSession();

    apiClient
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
        setStatus('ready');
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
        setStatus('error');
      });
  }, [clearSession, puzzleId, pushToast, setSession]);

  const buildAutosavePayload = useMemo<AutosavePayload | null>(() => {
    if (!session.playId) {
      return null;
    }
    return {
      progress: {
        cells: grid.cells,
        width: grid.width,
        height: grid.height,
        mistakes,
        updatedAt: grid.lastUpdated
      },
      timestamp: new Date().toISOString()
    };
  }, [grid.cells, grid.height, grid.lastUpdated, grid.width, mistakes, session.playId]);

  const autosave = useCallback(async () => {
    if (!session.playId || !buildAutosavePayload) {
      return;
    }
    setAutosaveState('saving');
    try {
      await apiClient.post(`/plays/${session.playId}/autosave`, buildAutosavePayload);
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
  }, [buildAutosavePayload, pushToast, session.playId]);

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

  return {
    status,
    playId: session.playId,
    autosaveState,
    lastSavedAt
  };
};
