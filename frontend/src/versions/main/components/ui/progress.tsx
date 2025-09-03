import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import {cn} from "../../../lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    animated?: boolean
    color?: 'default' | 'success' | 'warning' | 'danger'
  }
>(({ className, value, animated = false, color = 'default', ...props }, ref) => {
  const colorClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500"
  };

  return (
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
          "h-full w-full flex-1 transition-all",
          colorClasses[color],
          animated && "animate-pulse"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
