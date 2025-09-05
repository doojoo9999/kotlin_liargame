import * as React from "react"
import {motion} from "framer-motion"
import {cn} from "@/versions/main/lib/utils"
import {Badge} from "@/versions/main/components/ui/badge"
import {pulseGlow} from "@/versions/main/animations"

type StatusType =
  | 'online' | 'offline' | 'away' | 'ready' | 'playing'
  | 'voting' | 'defending' | 'eliminated' | 'winner' | 'loser'

interface StatusBadgeProps {
  status: StatusType
  animated?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

const statusConfig: Record<StatusType, {
  label: string
  color: string
  bgColor: string
  animated?: boolean
}> = {
  online: {
    label: "온라인",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-300",
    animated: true
  },
  offline: {
    label: "오프라인",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300"
  },
  away: {
    label: "자리비움",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-300"
  },
  ready: {
    label: "준비완료",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-300",
    animated: true
  },
  playing: {
    label: "게임중",
    color: "text-purple-700",
    bgColor: "bg-purple-100 border-purple-300"
  },
  voting: {
    label: "투표중",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-300",
    animated: true
  },
  defending: {
    label: "변론중",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-300",
    animated: true
  },
  eliminated: {
    label: "탈락",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-300"
  },
  winner: {
    label: "승리",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-300",
    animated: true
  },
  loser: {
    label: "패배",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-300"
  }
}

const sizeConfig = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-2"
}

export function StatusBadge({
  status,
  animated = false,
  size = 'md',
  className,
  children
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const shouldAnimate = animated && config.animated

  const content = children || config.label

  if (shouldAnimate) {
    return (
      <motion.div
        variants={pulseGlow}
        animate="animate"
        className={cn(
          "inline-flex items-center rounded-full border font-medium",
          config.color,
          config.bgColor,
          sizeConfig[size],
          className
        )}
      >
        {config.animated && (
          <motion.div
            className="w-2 h-2 rounded-full bg-current mr-2"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        {content}
      </motion.div>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        config.color,
        config.bgColor,
        sizeConfig[size],
        className
      )}
    >
      {content}
    </Badge>
  )
}

interface StatusIndicatorProps {
  status: StatusType
  className?: string
}

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <motion.div
      className={cn(
        "w-3 h-3 rounded-full border-2 border-white shadow-sm",
        config.bgColor.replace('bg-', 'bg-').split(' ')[0],
        className
      )}
      animate={config.animated ? {
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8]
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}
