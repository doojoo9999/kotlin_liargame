import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Badge} from '@/components/ui/badge';
import {AlertCircle, CheckCircle, Clock, Wifi, WifiOff} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useGameFlowStore} from '@/stores';
import {useShallow} from 'zustand/react/shallow';
import {useConnectionStore} from '@/stores/connectionStore';

interface GameTimerProps {
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'detailed';
  className?: string;
  onTimeUp?: () => void;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  showProgress = true,
  size = 'md',
  variant = 'detailed',
  className,
  onTimeUp
}) => {
  // Get timer data from store
  const { timer, gamePhase } = useGameFlowStore(useShallow((state) => ({
    timer: state.timer,
    gamePhase: state.gamePhase,
  })))

  const isConnected = useConnectionStore((state) => state.status === 'connected')
  
  const { isActive, timeRemaining, totalTime, phase } = timer
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());

  // Sync display time with server time
  useEffect(() => {
    setDisplayTime(timeRemaining);
    setLastSyncTime(Date.now());
    if (timeRemaining === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  // Client-side countdown for smooth display (sync with server updates)
  useEffect(() => {
    if (!isActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSyncTime) / 1000);
      const calculatedTime = Math.max(0, timeRemaining - elapsed);
      
      setDisplayTime(calculatedTime);
      
      // Call onTimeUp when time reaches 0
      if (calculatedTime <= 0) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, lastSyncTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!totalTime || totalTime <= 0) {
      return 0
    }
    return ((totalTime - displayTime) / totalTime) * 100
  };

  const isWarning = displayTime <= 30 && displayTime > 10;
  const isCritical = displayTime <= 10;
  const isExpired = displayTime === 0;

  const sizeConfig = {
    sm: { text: 'text-lg', card: 'p-2', icon: 'h-4 w-4' },
    md: { text: 'text-2xl', card: 'p-4', icon: 'h-5 w-5' },
    lg: { text: 'text-4xl', card: 'p-6', icon: 'h-6 w-6' }
  };

  const config = sizeConfig[size];

  const getPhaseTitle = () => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return 'Waiting for Players'
      case 'SPEECH':
        return 'Discussion Time'
      case 'VOTING_FOR_LIAR':
        return 'Voting for Liar'
      case 'DEFENDING':
        return 'Defense Phase'
      case 'VOTING_FOR_SURVIVAL':
        return 'Final Vote'
      case 'GUESSING_WORD':
        return 'Liar Guessing'
      case 'GAME_OVER':
        return 'Game Over'
      default:
        return phase || 'Game'
    }
  }

  const getStatusIcon = () => {
    if (isExpired) return CheckCircle;
    if (isCritical) return AlertCircle;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

  const timerVariants = {
    normal: { scale: 1 },
    warning: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } },
    critical: { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 0.5 } }
  };

  const getVariant = () => {
    if (isCritical) return 'critical';
    if (isWarning) return 'warning';
    return 'normal';
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        variants={timerVariants}
        animate={isActive ? getVariant() : 'normal'}
        className={cn(
          "inline-flex items-center space-x-2 px-3 py-1 rounded-full",
          isCritical && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          isWarning && !isCritical && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
          !isWarning && !isCritical && "bg-muted text-muted-foreground",
          className
        )}
      >
        <StatusIcon className={config.icon} />
        <span className={cn("font-mono font-bold", config.text)}>
          {formatTime(displayTime)}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={timerVariants}
      animate={isActive ? getVariant() : 'normal'}
      className={className}
    >
      <Card className={cn(
        "transition-all duration-300",
        isCritical && "border-red-500 bg-red-50 dark:bg-red-950",
        isWarning && !isCritical && "border-orange-500 bg-orange-50 dark:bg-orange-950"
      )}>
        <CardContent className={config.card}>
          <div className="text-center space-y-3">
            {/* Phase and Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {getPhaseTitle()}
                </Badge>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500 animate-pulse" />
                )}
                <span className="text-xs text-gray-500 capitalize">
                  {isConnected ? 'connected' : 'disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <StatusIcon className={cn(
                config.icon,
                isCritical && "text-red-500",
                isWarning && !isCritical && "text-orange-500",
                !isWarning && !isCritical && "text-muted-foreground"
              )} />
              <span className={cn(
                "font-mono font-bold",
                config.text,
                isCritical && "text-red-500",
                isWarning && !isCritical && "text-orange-500"
              )}>
                {formatTime(displayTime)}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className={cn(
                "text-sm font-medium",
                isCritical && "text-red-700 dark:text-red-300",
                isWarning && !isCritical && "text-orange-700 dark:text-orange-300",
                !isWarning && !isCritical && "text-muted-foreground"
              )}>
                {phase}
              </p>
              
              {showProgress && (
                <Progress 
                  value={getProgressPercentage()}
                  className={cn(
                    "h-2",
                    isCritical && "[&>div]:bg-red-500",
                    isWarning && !isCritical && "[&>div]:bg-orange-500"
                  )}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GameTimer;
