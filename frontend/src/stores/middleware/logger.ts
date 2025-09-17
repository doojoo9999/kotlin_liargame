import type {StateCreator, StoreMutatorIdentifier} from 'zustand';

// Simple action logger middleware for Zustand (non-invasive)
export const withLogger = <T extends object>(
  initializer: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const loggedSet: typeof set = (partial, replace) => {
    const prev = get();
    const partialValue = typeof partial === 'function' ? (partial as any)(prev) : partial;
    if (import.meta.env.DEV) {
      console.log('%c[Zustand][Action]', 'color:#4ade80', {
        partial: partialValue,
        replace: !!replace,
        prev,
      });
    }
    set(partial as any, replace);
    if (import.meta.env.DEV) {
      console.log('%c[Zustand][State]', 'color:#60a5fa', get());
    }
  };
  return initializer(loggedSet, get, api);
};

// Minimal marker to satisfy TS if needed
export type Logger = StoreMutatorIdentifier<'logger', unknown>;
