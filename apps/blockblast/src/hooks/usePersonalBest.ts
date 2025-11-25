import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'blockblast_personal_best';

export const usePersonalBest = () => {
  const [best, setBest] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = Number(window.localStorage.getItem(STORAGE_KEY) ?? 0);
    if (!Number.isNaN(stored)) setBest(stored);
  }, []);

  const updateBest = useCallback((score: number) => {
    setBest((prev) => {
      const next = Math.max(prev, score);
      if (next !== prev && typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  return { best, updateBest };
};
