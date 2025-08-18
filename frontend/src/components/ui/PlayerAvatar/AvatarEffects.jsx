import React, {memo, useEffect, useState} from 'react'
import {colors} from '@/styles'

// Ripple Effect Hook and Component
const useRipple = () => {
  const [ripples, setRipples] = useState([])

  const createRipple = (event) => {
    if (!event.currentTarget) return

    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    }

    setRipples(prevRipples => [...prevRipples, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prevRipples => prevRipples.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }

  const RippleEffect = memo(({ color }) => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 'inherit',
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            backgroundColor: color || colors.primary.main,
            animation: 'rippleAnimation 0.6s ease-out',
            pointerEvents: 'none',
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size
          }}
        />
      ))}
    </div>
  ))

  RippleEffect.displayName = 'RippleEffect'

  return { createRipple, RippleEffect }
}

// Main AvatarEffects component
const AvatarEffects = memo(({
  children,
  effect = null, // 'glow' | 'shake' | 'bounce' | 'fadeIn' | null
  duration = null,
  enableRipple = false,
  rippleColor = null,
  trigger = null, // for triggering one-time effects
  className,
  ...props
}) => {
  const { createRipple, RippleEffect } = useRipple()
  const [currentEffect, setCurrentEffect] = useState(effect)

  // Handle trigger-based effects
  useEffect(() => {
    if (trigger && (trigger === 'shake' || trigger === 'bounce' || trigger === 'fadeIn')) {
      setCurrentEffect(trigger)
      
      // Reset effect after animation duration
      const timeoutDuration = {
        shake: 500,
        bounce: 600,
        fadeIn: 300
      }[trigger] || 500

      const timeout = setTimeout(() => {
        setCurrentEffect(effect)
      }, timeoutDuration)

      return () => clearTimeout(timeout)
    }
  }, [trigger, effect])

  const handleClick = (event) => {
    if (enableRipple) {
      createRipple(event)
    }
    if (props.onClick) {
      props.onClick(event)
    }
  }

  const getEffectStyle = () => {
    if (!currentEffect) return {}
    
    const baseStyle = { transition: 'all 0.2s ease' }
    
    switch (currentEffect) {
      case 'glow':
        return {
          ...baseStyle,
          animation: `glowPulse ${duration || '2s'} infinite`
        }
      case 'shake':
        return {
          ...baseStyle,
          animation: 'shake 0.5s ease-in-out'
        }
      case 'bounce':
        return {
          ...baseStyle,
          animation: 'bounce 0.6s ease-out'
        }
      case 'fadeIn':
        return {
          ...baseStyle,
          animation: 'fadeIn 0.3s ease-out'
        }
      default:
        return baseStyle
    }
  }

  return (
    <div
      className={className}
      style={getEffectStyle()}
      onClick={handleClick}
      {...props}
    >
      {children}
      {enableRipple && <RippleEffect color={rippleColor} />}
    </div>
  )
})

AvatarEffects.displayName = 'AvatarEffects'

// Export individual effect components for direct use
export const GlowEffect = memo(({ children, duration = '2s', ...props }) => (
  <AvatarEffects effect="glow" duration={duration} {...props}>
    {children}
  </AvatarEffects>
))

export const ShakeEffect = memo(({ children, duration = '0.5s', trigger, ...props }) => (
  <AvatarEffects effect="shake" duration={duration} trigger={trigger} {...props}>
    {children}
  </AvatarEffects>
))

export const BounceEffect = memo(({ children, duration = '0.6s', trigger, ...props }) => (
  <AvatarEffects effect="bounce" duration={duration} trigger={trigger} {...props}>
    {children}
  </AvatarEffects>
))

export const FadeInEffect = memo(({ children, duration = '0.3s', ...props }) => (
  <AvatarEffects effect="fadeIn" duration={duration} {...props}>
    {children}
  </AvatarEffects>
))

GlowEffect.displayName = 'GlowEffect'
ShakeEffect.displayName = 'ShakeEffect'
BounceEffect.displayName = 'BounceEffect'
FadeInEffect.displayName = 'FadeInEffect'

export { useRipple }
export default AvatarEffects