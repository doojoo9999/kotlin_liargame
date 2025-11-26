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
      const payload = (await res.json()) as unknown;

      const asRecord = (value: unknown): Record<string, unknown> | null =>
        value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

      const items = (() => {
        const record = asRecord(payload);
        if (record?.top && Array.isArray(record.top)) return record.top as unknown[];
        if (record?.items && Array.isArray(record.items)) return record.items as unknown[];
        if (Array.isArray(payload)) return payload as unknown[];
        return [] as unknown[];
      })();

      const normalized = items.map((item, idx): LeaderboardEntry => {
        const obj = asRecord(item);
        const subjectKeyValue = obj?.subject_key;
        const nameFromSubject = typeof subjectKeyValue === 'string' ? subjectKeyValue.slice(0, 6) : null;
        const scoreValue = obj?.score;
        const comboMaxValue = obj?.combo_max ?? obj?.comboMax;
        const rankValue = obj?.rank;
        return {
          name:
            (typeof obj?.name === 'string' && obj.name) ||
            (typeof obj?.player === 'string' && obj.player) ||
            nameFromSubject ||
            `Player ${idx + 1}`,
          score: typeof scoreValue === 'number' ? scoreValue : 0,
          comboMax: typeof comboMaxValue === 'number' ? comboMaxValue : undefined,
          rank: typeof rankValue === 'number' ? rankValue : idx + 1,
          isSelf: typeof subjectKeyValue === 'string' && subjectKeyValue === subjectKey
        };
      });
      setEntries(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      setError(message ?? '리더보드 불러오기 실패');
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
