import * as React from "react"
import {cn} from "../../../lib/utils"
import {Badge} from "../ui/badge"

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'playing'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4'
}

const statusConfig = {
  online: { color: 'bg-green-500', text: '온라인', variant: 'online' as const },
  offline: { color: 'bg-gray-500', text: '오프라인', variant: 'offline' as const },
  away: { color: 'bg-yellow-500', text: '자리비움', variant: 'waiting' as const },
  playing: { color: 'bg-blue-500', text: '게임중', variant: 'playing' as const }
}

export function StatusIndicator({
  status,
  size = 'md',
  showText = false,
  className
}: StatusIndicatorProps) {
  const config = statusConfig[status]

  if (showText) {
    return (
      <Badge variant={config.variant} className={className}>
        <div className={cn('rounded-full mr-1', config.color, sizeClasses[size])} />
        {config.text}
      </Badge>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full',
        config.color,
        sizeClasses[size],
        status === 'online' && 'animate-pulse',
        className
      )}
    />
  )
}
