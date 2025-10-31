import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

const STORAGE_KEY = 'anon_id';

export const useSubjectKey = () => {
  const [subjectKey, setSubjectKey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (!subjectKey) {
      const generated = crypto.randomUUID?.() ?? nanoid();
      localStorage.setItem(STORAGE_KEY, generated);
      setSubjectKey(generated);
    }
  }, [subjectKey]);

  return subjectKey;
};
