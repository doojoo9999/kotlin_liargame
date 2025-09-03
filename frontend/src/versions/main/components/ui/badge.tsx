import * as React from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/versions/main/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // 게임 특화 뱃지 variants
        "role-citizen": "border-transparent bg-blue-100 text-blue-700 border border-blue-200",
        "role-liar": "border-transparent bg-red-100 text-red-700 border border-red-200",
        "game-primary": "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        "game-success": "border-transparent bg-green-600 text-white hover:bg-green-700",
        "game-warning": "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
        "game-danger": "border-transparent bg-red-600 text-white hover:bg-red-700",
        "status-online": "border-transparent bg-green-500 text-white animate-pulse",
        "status-offline": "border-transparent bg-gray-500 text-white",
        // 추가 게임 variant들
        "citizen": "border-transparent bg-blue-100 text-blue-700 border border-blue-200",
        "liar": "border-transparent bg-red-100 text-red-700 border border-red-200",
        "online": "border-transparent bg-green-500 text-white",
        "offline": "border-transparent bg-gray-500 text-white",
        "waiting": "border-transparent bg-yellow-500 text-white animate-pulse",
        "playing": "border-transparent bg-purple-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        pulse && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
