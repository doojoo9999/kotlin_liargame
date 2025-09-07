import * as React from "react"
import {Slot} from "@radix-ui/react-slot"
import {cva, type VariantProps} from "class-variance-authority"
import {motion} from "framer-motion"

import {cn} from "@/lib/utils"

const gameButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:scale-105",
        secondary: "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 hover:from-slate-300 hover:to-slate-400 border border-slate-300 hover:border-slate-400",
        danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105",
        success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transform hover:scale-105",
        warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transform hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-md",
        outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-md",
        vote: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105",
        ready: "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transform hover:scale-105",
        join: "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform hover:scale-105",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-14 w-14",
      },
      loading: {
        true: "pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      loading: false,
    },
  }
)

export interface GameButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof gameButtonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  animate?: boolean
}

const LoadingSpinner = () => (
  <motion.div
    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
  />
)

const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    asChild = false, 
    animate = true,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button
    const MotionComp = asChild ? Slot : (animate ? motion.button : "button")

    const buttonContent = (
      <>
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && (
          <span className="mr-2 flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </>
    )

    const buttonProps = {
      className: cn(gameButtonVariants({ variant, size, loading, className })),
      disabled: disabled || loading,
      ref,
      ...props
    }

    if (animate && !asChild) {
      return (
        <motion.button
          {...buttonProps}
          whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
          whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {buttonContent}
        </motion.button>
      )
    }

    return (
      <Comp {...buttonProps}>
        {buttonContent}
      </Comp>
    )
  }
)
GameButton.displayName = "GameButton"

export { GameButton, gameButtonVariants }