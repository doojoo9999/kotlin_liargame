import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {AlertCircle, CheckCircle, Clock} from 'lucide-react';
import {cn} from '@/lib/utils';

interface GameTimerProps {
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  phase: string;
  isActive: boolean;
  onTimeUp?: () => void;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'minimal' | 'detailed';
  className?: string;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  timeRemaining,
  totalTime,
  phase,
  isActive,
  onTimeUp,
  showProgress = true,
  size = 'md',
  variant = 'detailed',
  className,
}) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
    if (timeRemaining === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - displayTime) / totalTime) * 100;
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