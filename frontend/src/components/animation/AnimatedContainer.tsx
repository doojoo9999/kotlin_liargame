import * as React from 'react'
import {type HTMLMotionProps, motion} from 'framer-motion'

import type {AnimationType} from '@/animations/variants'
import {animationVariants} from '@/animations/variants'
import {cn} from '@/lib/utils'

interface AnimationOptions {
  type?: AnimationType
  delay?: number
  duration?: number
  className?: string
}

export interface AnimatedContainerProps
  extends Omit<HTMLMotionProps<'div'>, keyof AnimationOptions>,
    AnimationOptions {
  children: React.ReactNode
  stagger?: boolean
  staggerDelay?: number
}

const enhanceVariant = (
  base: import('framer-motion').Variants,
  { duration, delay, applyDelay }: { duration?: number; delay?: number; applyDelay: boolean }
): import('framer-motion').Variants => {
  if ((!duration || duration <= 0) && (!applyDelay || !delay || delay <= 0)) {
    return base
  }

  const animate = base.animate
  if (typeof animate !== 'object' || animate === null || Array.isArray(animate)) {
    return base
  }

  const baseTransition =
    'transition' in animate && typeof animate.transition === 'object' && animate.transition !== null
      ? animate.transition
      : {}

  const transition = { ...baseTransition } as Record<string, unknown>

  if (duration && duration > 0) {
    transition.duration = duration
  }

  if (applyDelay && delay && delay > 0) {
    transition.delay = delay
  }

  return {
    ...base,
    animate: {
      ...animate,
      transition
    }
  }
}

export const AnimatedContainer = React.forwardRef<HTMLDivElement, AnimatedContainerProps>((props, ref) => {
  const {
    children,
    type = 'fadeIn',
    delay = 0,
    duration,
    className,
    stagger = false,
    staggerDelay = 0.1,
    style,
    ...rest
  } = props

  const baseVariant = React.useMemo(() => {
    const fallback: AnimationType = 'fadeIn'
    const key = type in animationVariants ? (type as AnimationType) : fallback
    return animationVariants[key] ?? animationVariants[fallback]
  }, [type])

  const variants = React.useMemo(
    () => enhanceVariant(baseVariant, { duration, delay, applyDelay: !stagger }),
    [baseVariant, duration, delay, stagger]
  )

  const containerVariants = React.useMemo(() => {
    if (!stagger) {
      return variants
    }

    const transition: { staggerChildren: number; delayChildren?: number } = {
      staggerChildren: staggerDelay
    }

    if (delay > 0) {
      transition.delayChildren = delay
    }

    return {
      initial: {},
      animate: { transition },
      exit: {}
    }
  }, [variants, stagger, staggerDelay, delay])

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(className)}
      style={style}
      {...rest}
    >
      {stagger
        ? React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={variants}
              transition={{
                ...(duration && duration > 0 ? { duration } : {}),
                delay: delay + index * staggerDelay
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
})
AnimatedContainer.displayName = 'AnimatedContainer'

const withType = (animationType: AnimationType) =>
  React.forwardRef<HTMLDivElement, Omit<AnimatedContainerProps, 'type'>>((props, ref) => (
    <AnimatedContainer ref={ref} type={animationType} {...props} />
  ))

export const FadeInContainer = withType('fadeIn')
FadeInContainer.displayName = 'FadeInContainer'

export const SlideInContainer = withType('slideIn')
SlideInContainer.displayName = 'SlideInContainer'

export const ScaleInContainer = withType('scaleIn')
ScaleInContainer.displayName = 'ScaleInContainer'

export const BounceInContainer = withType('bounceIn')
BounceInContainer.displayName = 'BounceInContainer'

export const SlideUpContainer = withType('slideUp')
SlideUpContainer.displayName = 'SlideUpContainer'

export const SlideDownContainer = withType('slideDown')
SlideDownContainer.displayName = 'SlideDownContainer'
