import { useEffect, useState } from 'react';

const STORAGE_KEY = 'anon_id';

const generateSubjectKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  let timestamp = Date.now();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    timestamp += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (timestamp + Math.random() * 16) % 16 | 0;
    timestamp = Math.floor(timestamp / 16);
    if (char === 'x') return random.toString(16);
    return ((random & 0x3) | 0x8).toString(16);
  });
};

export const useSubjectKey = () => {
  const [subjectKey, setSubjectKey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (!subjectKey) {
      const generated = generateSubjectKey();
      localStorage.setItem(STORAGE_KEY, generated);
      setSubjectKey(generated);
    }
  }, [subjectKey]);

  return subjectKey;
};
