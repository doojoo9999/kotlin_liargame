import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import {cn} from "@/versions/main/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "game-timer" | "game-danger" | "game-success"
    animated?: boolean
    color?: "default" | "danger" | "warning" | "success" | "primary"
  }
>(({ className, value, variant = "default", animated = false, color, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all",
        {
          // Variant 기반 스타일
          "bg-game-warning": variant === "game-timer",
          "bg-game-danger": variant === "game-danger",
          "bg-game-success": variant === "game-success",

          // Color prop 기반 스타일 (variant보다 우선)
          "bg-red-500": color === "danger",
          "bg-yellow-500": color === "warning",
          "bg-green-500": color === "success",
          "bg-blue-500": color === "primary",

          // Animated 속성 적용
          "animate-pulse": animated,
        }
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
