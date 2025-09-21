import React from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AlertCircle, CheckCircle, Loader2, Signal} from 'lucide-react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useGameWebSocket} from '../../../hooks/useGameWebSocket';
import {useConnectionStore} from '@/stores/connectionStore';
import type {ConnectionStoreState} from '@/types/store';
import {useShallow} from 'zustand/react/shallow';

export interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

interface StatusDescriptor {
  status: 'error' | 'connected' | 'connecting' | 'reconnecting' | 'degraded';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
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

  const selectConnectionMetrics = useShallow((state: ConnectionStoreState) => ({
    realtimeStatus: state.status,
    avgLatency: state.avgLatency,
    backlog: state.messageQueue.length + Object.keys(state.pendingMessages).length,
  }));

  const connectionMetrics = useConnectionStore(selectConnectionMetrics);

  const { realtimeStatus, avgLatency, backlog } = connectionMetrics;

  const isReconnecting = realtimeStatus === 'reconnecting';
  const isDegraded = realtimeStatus === 'connected' && (backlog > 0 || (avgLatency ?? 0) > 1500);

  const metricsText = React.useMemo(() => {
    if (backlog > 0) {
      return `대기 ${backlog}건`;
    }
    if (avgLatency != null && avgLatency > 0) {
      return `${Math.round(avgLatency)}ms`;
    }
    return undefined;
  }, [avgLatency, backlog]);

  const getConnectionStatus = (): StatusDescriptor => {
    if (connectionError || realtimeStatus === 'error') {
      return {
        status: 'error',
        icon: AlertCircle,
        text: '연결 오류',
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      };
    }

    if (isReconnecting) {
      return {
        status: 'reconnecting',
        icon: Loader2,
        text: '재연결 중...',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      };
    }

    if (isDegraded) {
      return {
        status: 'degraded',
        icon: Signal,
        text: '연결 품질 저하',
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800'
      };
    }

    if (isConnected || realtimeStatus === 'connected') {
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
            (statusInfo.status === 'connecting' || statusInfo.status === 'reconnecting') && "animate-spin"
          )}
        />
        <span className={cn("text-sm", statusInfo.color)}>
          {statusInfo.text}
        </span>
        {metricsText && statusInfo.status !== 'error' && (
          <span className="text-xs text-muted-foreground">({metricsText})</span>
        )}
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
                (statusInfo.status === 'connecting' || statusInfo.status === 'reconnecting') && "animate-spin"
              )}
            />
            <div>
              <div className={cn("font-medium", statusInfo.color)}>
                {statusInfo.text}
              </div>
              {metricsText && statusInfo.status !== 'error' && (
                <div className="text-xs text-muted-foreground mt-1">
                  {metricsText}
                </div>
              )}
              {showDetails && connectionError && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {connectionError}
                </div>
              )}
            </div>
          </div>

          {(statusInfo.status === 'error' || statusInfo.status === 'degraded') && (
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
            {statusInfo.status === 'degraded' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  네트워크 지연이 감지되었습니다. 입력한 동작이 반영되기까지 시간이 걸릴 수 있습니다.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};
