import * as React from "react"
import {HTMLMotionProps, motion, Variants} from "framer-motion"
import {cn} from "@/lib/utils"
import {AnimationProps, AnimationType} from "@/types/game"

// Animation variants for different types
const animationVariants: Record<AnimationType, Variants> = {
  slideIn: {
    initial: { opacity: 0, x: -50 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, x: 50 }
  },
  
  fadeIn: {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5 }
    },
    exit: { opacity: 0 }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  bounceIn: {
    initial: { opacity: 0, y: -100 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 600, 
        damping: 20,
        bounce: 0.6
      }
    },
    exit: { opacity: 0, y: 100 }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    },
    exit: { opacity: 0, y: -50 }
  },
  
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 }
    },
    exit: { opacity: 0, y: 50 }
  }
}

interface AnimatedContainerProps 
  extends Omit<HTMLMotionProps<"div">, keyof AnimationProps>, 
          AnimationProps {
  children: React.ReactNode
  stagger?: boolean
  staggerDelay?: number
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  type = 'fadeIn',
  delay = 0,
  duration,
  className,
  stagger = false,
  staggerDelay = 0.1,
  ...props
}) => {
  const variants = animationVariants[type]
  
  // Apply custom duration if provided
  const customVariants = duration ? {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...variants.animate.transition,
        duration
      }
    }
  } : variants

  // Stagger animation for children
  const containerVariants = stagger ? {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay
      }
    },
    exit: {}
  } : customVariants

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(className)}
      style={{ ...props.style }}
      {...props}
    >
      {stagger ? (
        React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={customVariants}
            transition={{ delay: delay + (index * staggerDelay) }}
          >
            {child}
          </motion.div>
        ))
      ) : (
        children
      )}
    </motion.div>
  )
}

// Specialized containers for common use cases
export const FadeInContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="fadeIn" {...props} />
)

export const SlideInContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="slideIn" {...props} />
)

export const ScaleInContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="scaleIn" {...props} />
)

export const BounceInContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="bounceIn" {...props} />
)

export const SlideUpContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="slideUp" {...props} />
)

export const SlideDownContainer: React.FC<Omit<AnimatedContainerProps, 'type'>> = (props) => (
  <AnimatedContainer type="slideDown" {...props} />
)