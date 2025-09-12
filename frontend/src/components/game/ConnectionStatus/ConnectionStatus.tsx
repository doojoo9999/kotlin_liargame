import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, CheckCircle, Loader2} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useGameWebSocket} from '../../../hooks/useGameWebSocket';

export interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showDetails = false,
  compact = false
}) => {
  const {
    isConnected,
    connectionError,
    retry
  } = useGameWebSocket();

  const getConnectionStatus = () => {
    if (connectionError) {
      return {
        status: 'error',
        icon: AlertCircle,
        text: '연결 오류',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }

    if (isConnected) {
      return {
        status: 'connected',
        icon: CheckCircle,
        text: '실시간 연결됨',
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      };
    }

    return {
      status: 'connecting',
      icon: Loader2,
      text: '연결 중...',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    };
  };

  const statusInfo = getConnectionStatus();
  const Icon = statusInfo.icon;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Icon
          className={cn(
            "w-4 h-4",
            statusInfo.color,
            statusInfo.status === 'connecting' && "animate-spin"
          )}
        />
        <span className={cn("text-sm", statusInfo.color)}>
          {statusInfo.text}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      statusInfo.bgColor,
      statusInfo.borderColor,
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              className={cn(
                "w-5 h-5",
                statusInfo.color,
                statusInfo.status === 'connecting' && "animate-spin"
              )}
            />
            <div>
              <div className={cn("font-medium", statusInfo.color)}>
                {statusInfo.text}
              </div>
              {showDetails && connectionError && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {connectionError}
                </div>
              )}
            </div>
          </div>

          {statusInfo.status === 'error' && (
            <Button
              onClick={retry}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              재연결
            </Button>
          )}
        </div>

        {showDetails && (
          <AnimatePresence>
            {statusInfo.status === 'connected' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-green-200 dark:border-green-800"
              >
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  실시간 채팅과 게임 상태가 동기화됩니다.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};
