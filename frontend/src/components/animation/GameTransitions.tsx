import * as React from "react"
import {AnimatePresence, motion, Variants} from "framer-motion"
import {cn} from "@/lib/utils"

// Page transition animations
export const PageTransition: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  const pageVariants: Variants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  )
}

// Modal transition animations
export const ModalTransition: React.FC<{
  children: React.ReactNode
  isOpen: boolean
  onClose?: () => void
  className?: string
}> = ({ children, isOpen, onClose, className }) => {
  const backdropVariants: Variants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      transition: { duration: 0.3 }
    }
  }

  const modalVariants: Variants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            className={cn("relative z-10", className)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Card hover animations
export const HoverCard: React.FC<{
  children: React.ReactNode
  className?: string
  hoverScale?: number
  tapScale?: number
  disabled?: boolean
}> = ({ 
  children, 
  className, 
  hoverScale = 1.02, 
  tapScale = 0.98,
  disabled = false 
}) => {
  return (
    <motion.div
      whileHover={disabled ? {} : { scale: hoverScale, y: -2 }}
      whileTap={disabled ? {} : { scale: tapScale }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn("cursor-pointer", disabled && "cursor-default", className)}
    >
      {children}
    </motion.div>
  )
}

// List item animations
export const ListItem: React.FC<{
  children: React.ReactNode
  index?: number
  className?: string
}> = ({ children, index = 0, className }) => {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index * 0.1
      }
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Notification/Toast animations
export const ToastTransition: React.FC<{
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}> = ({ children, position = 'top', className }) => {
  const getInitialPosition = () => {
    switch (position) {
      case 'top':
        return { y: -100, opacity: 0 }
      case 'bottom':
        return { y: 100, opacity: 0 }
      case 'left':
        return { x: -100, opacity: 0 }
      case 'right':
        return { x: 100, opacity: 0 }
      default:
        return { y: -100, opacity: 0 }
    }
  }

  const getExitPosition = () => {
    switch (position) {
      case 'top':
        return { y: -50, opacity: 0 }
      case 'bottom':
        return { y: 50, opacity: 0 }
      case 'left':
        return { x: -50, opacity: 0 }
      case 'right':
        return { x: 50, opacity: 0 }
      default:
        return { y: -50, opacity: 0 }
    }
  }

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={getExitPosition()}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Loading spinner animations
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <motion.div
      className={cn(
        "border-2 border-current border-t-transparent rounded-full",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  )
}

// Pulse animation for loading states
export const PulseLoader: React.FC<{
  className?: string
  size?: 'sm' | 'md' | 'lg'
}> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            "bg-current rounded-full",
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Success/Error state animations
export const StateIndicator: React.FC<{
  state: 'success' | 'error' | 'loading'
  children?: React.ReactNode
  className?: string
}> = ({ state, children, className }) => {
  const stateVariants: Variants = {
    loading: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    success: {
      scale: [0.8, 1.2, 1],
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 300
      }
    },
    error: {
      x: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  }

  return (
    <motion.div
      variants={stateVariants}
      animate={state}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  )
}

// Game phase transition animations
export const PhaseTransition: React.FC<{
  children: React.ReactNode
  phaseKey: string
  className?: string
}> = ({ children, phaseKey, className }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={{
          opacity: 0,
          rotateY: 90,
          scale: 0.8
        }}
        animate={{
          opacity: 1,
          rotateY: 0,
          scale: 1,
          transition: {
            duration: 0.6,
            type: "spring",
            stiffness: 300,
            damping: 30
          }
        }}
        exit={{
          opacity: 0,
          rotateY: -90,
          scale: 0.8,
          transition: {
            duration: 0.4,
            ease: "easeIn"
          }
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}