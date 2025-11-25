import { useCallback, useEffect, useMemo, useState } from 'react';

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank?: number;
  comboMax?: number;
  isSelf?: boolean;
}

const SUBJECT_KEY_KEY = 'blockblast_subject_key';

const ensureSubjectKey = () => {
  if (typeof window === 'undefined') return 'anonymous';
  const existing = window.localStorage.getItem(SUBJECT_KEY_KEY);
  if (existing) return existing;
  const key = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2);
  window.localStorage.setItem(SUBJECT_KEY_KEY, key);
  return key;
};

export const useLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subjectKey = useMemo(() => ensureSubjectKey(), []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/blockblast/leaderboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const list: LeaderboardEntry[] = Array.isArray(payload?.top)
        ? payload.top
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];
      const normalized = list.map((item: any, idx: number) => ({
        name: item.name ?? item.player ?? item.subject_key?.slice(0, 6) ?? `Player ${idx + 1}`,
        score: item.score ?? 0,
        comboMax: item.combo_max ?? item.comboMax,
        rank: item.rank ?? idx + 1,
        isSelf: Boolean(item.subject_key && item.subject_key === subjectKey)
      }));
      setEntries(normalized);
    } catch (err: any) {
      setError(err?.message ?? '리더보드 불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [subjectKey]);

  const submitScore = useCallback(
    async (score: number, comboMax: number) => {
      try {
        await fetch('/api/blockblast/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, combo_max: comboMax, subject_key: subjectKey })
        });
        fetchLeaderboard();
      } catch (err) {
        // 네트워크 실패 시 조용히 무시, UI는 마지막 에러를 유지
        console.error('submit score failed', err);
      }
    },
    [fetchLeaderboard, subjectKey]
  );

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, loading, error, refresh: fetchLeaderboard, submitScore };
};
