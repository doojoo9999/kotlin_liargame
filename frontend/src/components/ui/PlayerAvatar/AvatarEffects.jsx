import React, {memo, useEffect, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {colors} from '@/styles'

// Animation keyframes
const rippleAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`

const glowPulseAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px ${colors.primary.main}40;
  }
  50% {
    box-shadow: 0 0 20px ${colors.primary.main}80, 0 0 30px ${colors.primary.main}60;
  }
`

const shakeAnimation = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
`

const bounceAnimation = keyframes`
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -6px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -3px, 0);
  }
  90% {
    transform: translate3d(0, -1px, 0);
  }
`

const fadeInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

// Ripple Effect Component
const RippleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
`

const RippleElement = styled.div`
  position: absolute;
  border-radius: 50%;
  background-color: ${props => props.color || colors.primary.main};
  animation: ${rippleAnimation} 0.6s ease-out;
  pointer-events: none;

  ${props => css`
    left: ${props.x - props.size / 2}px;
    top: ${props.y - props.size / 2}px;
    width: ${props.size}px;
    height: ${props.size}px;
  `}
`

// Effect wrapper components
const EffectWrapper = styled.div`
  ${props => props.effect === 'glow' && css`
    animation: ${glowPulseAnimation} ${props.duration || '2s'} infinite;
  `}

  ${props => props.effect === 'shake' && css`
    animation: ${shakeAnimation} ${props.duration || '0.5s'} ease-in-out;
  `}

  ${props => props.effect === 'bounce' && css`
    animation: ${bounceAnimation} ${props.duration || '0.6s'} ease-out;
  `}

  ${props => props.effect === 'fadeIn' && css`
    animation: ${fadeInAnimation} ${props.duration || '0.3s'} ease-out;
  `}
`

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
    <RippleContainer>
      {ripples.map(ripple => (
        <RippleElement
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          size={ripple.size}
          color={color}
        />
      ))}
    </RippleContainer>
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

  return (
    <EffectWrapper
      effect={currentEffect}
      duration={duration}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
      {enableRipple && <RippleEffect color={rippleColor} />}
    </EffectWrapper>
  )
})

AvatarEffects.displayName = 'AvatarEffects'

// Export individual effect components for direct use
export const GlowEffect = memo(({ children, duration = '2s', ...props }) => (
  <EffectWrapper effect="glow" duration={duration} {...props}>
    {children}
  </EffectWrapper>
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
  <EffectWrapper effect="fadeIn" duration={duration} {...props}>
    {children}
  </EffectWrapper>
))

GlowEffect.displayName = 'GlowEffect'
ShakeEffect.displayName = 'ShakeEffect'
BounceEffect.displayName = 'BounceEffect'
FadeInEffect.displayName = 'FadeInEffect'

export { useRipple }
export default AvatarEffects