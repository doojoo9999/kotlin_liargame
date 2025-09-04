import {useCallback, useEffect, useState} from 'react';

interface UseGameTimerProps {
  initialTime: number;
  onTimeUp?: () => void;
  onWarning?: (timeLeft: number) => void;
  warningThreshold?: number;
  autoReset?: boolean;
}

export const useGameTimer = ({
  initialTime,
  onTimeUp,
  onWarning,
  warningThreshold = 10,
  autoReset = true
}: UseGameTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  const resetTimer = useCallback(() => {
    setTimeLeft(initialTime);
    setHasWarned(false);
    setIsActive(true);
    setIsPaused(false);
  }, [initialTime]);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
  }, []);

  const startTimer = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (!isActive || isPaused) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Warning threshold
        if (newTime <= warningThreshold && !hasWarned) {
          setHasWarned(true);
          onWarning?.(newTime);
        }
        
        // Time up
        if (newTime <= 0) {
          onTimeUp?.();
          if (autoReset) {
            return initialTime;
          } else {
            setIsActive(false);
            return 0;
          }
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, isPaused]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimeColor = useCallback((seconds: number) => {
    if (seconds <= 5) return 'danger';
    if (seconds <= warningThreshold) return 'warning';
    return 'primary';
  }, [warningThreshold]);

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    timeColor: getTimeColor(timeLeft),
    progress: Math.min(100, Math.max(0, progress)),
    isActive,
    isPaused,
    isWarning: timeLeft <= warningThreshold,
    isCritical: timeLeft <= 5,
    resetTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    startTimer
  };
};