import * as React from "react"
import {motion} from "framer-motion"
import {Button, ButtonProps} from "../ui/button"
import {cn} from "../../lib/utils"

export interface GameButtonProps extends ButtonProps {
  gameVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  loading?: boolean
  interactive?: boolean
  animation?: string
  particleEffect?: boolean
}

export function GameButton({
  children,
  className,
  gameVariant = 'primary',
  loading = false,
  interactive = true,
  disabled,
  ...props
}: GameButtonProps) {
  const getGameVariant = () => {
    switch (gameVariant) {
      case 'primary': return 'game-primary'
      case 'secondary': return 'secondary'
      case 'success': return 'game-success'
      case 'warning': return 'game-warning'
      case 'danger': return 'game-danger'
      default: return 'default'
    }
  }

  return (
    <motion.div
      whileHover={interactive && !disabled ? { scale: 1.02 } : undefined}
      whileTap={interactive && !disabled ? { scale: 0.98 } : undefined}
    >
      <Button
        variant={getGameVariant()}
        className={cn(
          "font-medium transition-all duration-200",
          {
            "cursor-not-allowed": disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        loading={loading}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}
