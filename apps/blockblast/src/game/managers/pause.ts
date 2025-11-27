export interface PauseHandlers {
  onPause?: () => void;
  onResume?: () => void;
}

// Hooks into tab visibility to pause timers/audio when the user switches contexts.
export const bindPauseResume = ({ onPause, onResume }: PauseHandlers) => {
  if (typeof document === 'undefined') return () => undefined;

  const handleVisibility = () => {
    if (document.hidden) {
      onPause?.();
    } else {
      onResume?.();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
};
