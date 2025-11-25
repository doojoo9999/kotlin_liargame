import { useCallback, useRef } from 'react';

type Pattern = number | number[];

const vibrationSupported = () =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';

const PATTERNS: Record<
  'tick' | 'drop' | 'invalid' | 'clear' | 'comboWave' | 'danger',
  Pattern
> = {
  tick: [8],
  drop: [22],
  invalid: [16, 8],
  clear: [18, 30, 18],
  comboWave: [18, 24, 18, 32],
  danger: [80, 40, 80]
};

export const useHaptics = () => {
  const lastTick = useRef(0);

  const vibrate = useCallback((pattern: Pattern) => {
    if (!vibrationSupported()) return;
    navigator.vibrate(pattern);
  }, []);

  const microTick = useCallback(() => {
    const now = Date.now();
    if (now - lastTick.current < 120) return;
    lastTick.current = now;
    vibrate(PATTERNS.tick);
  }, [vibrate]);

  const drop = useCallback(() => vibrate(PATTERNS.drop), [vibrate]);
  const invalid = useCallback(() => vibrate(PATTERNS.invalid), [vibrate]);
  const clear = useCallback(() => vibrate(PATTERNS.clear), [vibrate]);
  const comboWave = useCallback(() => vibrate(PATTERNS.comboWave), [vibrate]);
  const danger = useCallback(() => vibrate(PATTERNS.danger), [vibrate]);

  return {
    microTick,
    drop,
    invalid,
    clear,
    comboWave,
    danger
  };
};
