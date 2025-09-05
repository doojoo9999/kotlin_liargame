import * as React from "react"
import {AnimatePresence, motion} from "framer-motion"
import {AlertCircle, RefreshCw, Wifi, WifiOff} from "lucide-react"
import {cn} from "@/versions/main/lib/utils"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Progress} from "@/versions/main/components/ui/progress"

interface ConnectionStatusProps {
  isConnected: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
  latency?: number
  onReconnect?: () => void
  className?: string
}

export function ConnectionStatus({
  isConnected,
  connectionState,
  latency = 0,
  onReconnect,
  className
}: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: Wifi,
          label: '연결됨',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        }
      case 'connecting':
        return {
          icon: RefreshCw,
          label: '연결 중...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        }
      case 'error':
        return {
          icon: AlertCircle,
          label: '연결 오류',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        }
      default:
        return {
          icon: WifiOff,
          label: '연결 끊김',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const getLatencyColor = () => {
    if (latency < 100) return 'text-green-600'
    if (latency < 300) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConnectionQuality = () => {
    if (latency < 50) return { label: '최고', value: 100 }
    if (latency < 100) return { label: '좋음', value: 80 }
    if (latency < 200) return { label: '보통', value: 60 }
    if (latency < 500) return { label: '나쁨', value: 40 }
    return { label: '매우 나쁨', value: 20 }
  }

  const quality = getConnectionQuality()

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "w-4 h-4",
              config.color,
              connectionState === 'connecting' && "animate-spin"
            )}
          />
          <span className="text-sm font-medium">{config.label}</span>
        </div>

        {isConnected && latency > 0 && (
          <Badge variant="outline" className={cn("text-xs", getLatencyColor())}>
            {latency}ms
          </Badge>
        )}
      </div>

      {isConnected && latency > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>연결 품질: {quality.label}</span>
            <span>{latency}ms</span>
          </div>
          <Progress value={quality.value} className="h-1" />
        </div>
      )}

      {!isConnected && onReconnect && (
        <Button
          onClick={onReconnect}
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={connectionState === 'connecting'}
        >
          <RefreshCw className={cn(
            "w-3 h-3 mr-1",
            connectionState === 'connecting' && "animate-spin"
          )} />
          다시 연결
        </Button>
      )}
    </div>
  )
}

interface OfflineIndicatorProps {
  isOffline: boolean
  onReconnect?: () => void
  className?: string
}

export function OfflineIndicator({
  isOffline,
  onReconnect,
  className
}: OfflineIndicatorProps) {
  if (!isOffline) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
          className
        )}
      >
        <Card className="bg-red-50 border-red-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  인터넷 연결이 끊어졌습니다
                </p>
                <p className="text-xs text-red-600">
                  게임이 일시 중단되었습니다. 연결을 확인해주세요.
                </p>
              </div>
              {onReconnect && (
                <Button
                  onClick={onReconnect}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  재연결
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

interface ReconnectingOverlayProps {
  isReconnecting: boolean
  attempts: number
  maxAttempts: number
  onCancel?: () => void
}

export function ReconnectingOverlay({
  isReconnecting,
  attempts,
  maxAttempts,
  onCancel
}: ReconnectingOverlayProps) {
  if (!isReconnecting) return null

  const progress = (attempts / maxAttempts) * 100

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <Card className="w-80">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>

              <div>
                <h3 className="font-semibold mb-1">서버에 재연결 중</h3>
                <p className="text-sm text-muted-foreground">
                  연결을 복구하고 있습니다... ({attempts}/{maxAttempts})
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  잠시만 기다려 주세요
                </p>
              </div>

              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  취소
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
