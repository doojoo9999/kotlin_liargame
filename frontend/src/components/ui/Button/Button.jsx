import React, {forwardRef, useEffect, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {motion} from 'framer-motion'
import {useRipple} from '../PlayerAvatar/AvatarEffects.jsx'

// Base button styles using design tokens
const BaseButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.fontFamily.primary};
  font-weight: ${({ theme }) => theme.fontWeight.semiBold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  border: none;
  outline: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: ${({ theme }) => theme.semanticTransitions.button.default};
  text-decoration: none;
  user-select: none;
  
  /* Prevent text selection on double click */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Focus styles for accessibility */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }
  
  /* Disabled state */
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none !important;
    box-shadow: ${({ theme }) => theme.semanticShadows.button.disabled} !important;
  }
  
  /* Loading state */
  ${({ $isLoading }) => $isLoading && css`
    cursor: not-allowed;
    
    & > *:not(.loading-spinner) {
      opacity: 0;
    }
  `}
`

// Size variants
const sizeStyles = {
  small: css`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
    font-size: ${({ theme }) => theme.fontSize.xs};
    line-height: ${({ theme }) => theme.lineHeight.none};
    border-radius: ${({ theme }) => theme.semanticBorderRadius.button.small};
    min-height: 32px;
  `,
  medium: css`
    padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
    font-size: ${({ theme }) => theme.fontSize.sm};
    line-height: ${({ theme }) => theme.lineHeight.none};
    border-radius: ${({ theme }) => theme.semanticBorderRadius.button.medium};
    min-height: 40px;
  `,
  large: css`
    padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
    font-size: ${({ theme }) => theme.fontSize.base};
    line-height: ${({ theme }) => theme.lineHeight.none};
    border-radius: ${({ theme }) => theme.semanticBorderRadius.button.large};
    min-height: 48px;
  `
}

// Variant styles
const variantStyles = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.primary[500]};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.semanticShadows.button.default};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primary[600]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.hover};
      transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primary[700]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.active};
      transform: translateY(0);
    }
  `,
  
  secondary: css`
    background-color: ${({ theme }) => theme.colors.secondary[500]};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.semanticShadows.button.default};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.secondary[600]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.hover};
      transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.secondary[700]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.active};
      transform: translateY(0);
    }
  `,
  
  outline: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary[500]};
    border: 1px solid ${({ theme }) => theme.colors.primary[500]};
    box-shadow: ${({ theme }) => theme.shadows.none};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primary[50]};
      border-color: ${({ theme }) => theme.colors.primary[600]};
      color: ${({ theme }) => theme.colors.primary[600]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.hover};
      transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primary[100]};
      border-color: ${({ theme }) => theme.colors.primary[700]};
      color: ${({ theme }) => theme.colors.primary[700]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.active};
      transform: translateY(0);
    }
  `,
  
  ghost: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    box-shadow: ${({ theme }) => theme.shadows.none};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.surface.tertiary};
      color: ${({ theme }) => theme.colors.primary[600]};
      box-shadow: ${({ theme }) => theme.shadows.sm};
      transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primary[50]};
      color: ${({ theme }) => theme.colors.primary[700]};
      box-shadow: ${({ theme }) => theme.semanticShadows.button.active};
      transform: translateY(0);
    }
  `
}

// Game-specific variant styles
const gameVariantStyles = {
  liar: css`
    background-color: ${({ theme }) => theme.colors.game.liar[500]};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.coloredShadows.game.liar};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.game.liar[600]};
      transform: translateY(-1px) scale(1.02);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.game.liar[700]};
      transform: translateY(0) scale(1);
    }
  `,
  
  citizen: css`
    background-color: ${({ theme }) => theme.colors.game.citizen[500]};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.coloredShadows.game.citizen};
    
    &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.game.citizen[600]};
      transform: translateY(-1px) scale(1.02);
    }
    
    &:active:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.game.citizen[700]};
      transform: translateY(0) scale(1);
    }
  `,
  
  action: css`
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[500]}, ${({ theme }) => theme.colors.secondary[500]});
    color: ${({ theme }) => theme.colors.white};
    box-shadow: ${({ theme }) => theme.coloredShadows.primary};
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[600]}, ${({ theme }) => theme.colors.secondary[600]});
      transform: translateY(-2px) scale(1.02);
      box-shadow: ${({ theme }) => theme.shadows.lg};
    }
    
    &:active:not(:disabled) {
      transform: translateY(-1px) scale(1.01);
      box-shadow: ${({ theme }) => theme.shadows.md};
    }
  `
}

// Feedback animations
const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
`

const successPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

// Loading spinner component
const LoadingSpinner = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

// Success/Error feedback icons
const FeedbackIcon = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  
  &.success {
    color: ${({ theme }) => theme.colors.success[600]};
    animation: ${successPulse} 0.5s ease-out;
    
    &::before {
      content: '✓';
    }
  }
  
  &.error {
    color: ${({ theme }) => theme.colors.error[600]};
    
    &::before {
      content: '✗';
    }
  }
`

// Ripple container for buttons
const ButtonRippleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
`

// Styled button with all variants and feedback states
const StyledButton = styled(BaseButton)`
  ${({ $size }) => sizeStyles[$size || 'medium']}
  ${({ $variant }) => variantStyles[$variant] || gameVariantStyles[$variant] || variantStyles.primary}
  
  /* Feedback state animations */
  ${({ $feedbackState }) => $feedbackState === 'error' && css`
    animation: ${shakeAnimation} 0.5s ease-in-out;
  `}
  
  ${({ $feedbackState }) => $feedbackState === 'success' && css`
    animation: ${successPulse} 0.5s ease-out;
  `}
  
  /* Hide content during feedback display */
  ${({ $showFeedback }) => $showFeedback && css`
    & > *:not(.feedback-icon):not(.button-ripple) {
      opacity: 0;
    }
  `}
`

// Button component
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  // New enhanced interaction props
  enableRipple = false,
  feedbackState = null, // null | 'success' | 'error'
  feedbackDuration = 1000,
  rippleColor = null,
  ...props
}, ref) => {
  const { createRipple, RippleEffect } = useRipple()
  const [currentFeedback, setCurrentFeedback] = useState(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // Handle feedback state changes
  useEffect(() => {
    if (feedbackState && feedbackState !== currentFeedback) {
      setCurrentFeedback(feedbackState)
      setShowFeedback(true)
      
      const timer = setTimeout(() => {
        setShowFeedback(false)
        setCurrentFeedback(null)
      }, feedbackDuration)
      
      return () => clearTimeout(timer)
    }
  }, [feedbackState, currentFeedback, feedbackDuration])

  const handleClick = (e) => {
    if (isLoading || disabled) return
    
    // Create ripple effect if enabled
    if (enableRipple) {
      createRipple(e)
    }
    
    onClick?.(e)
  }

  const isInteractionDisabled = disabled || isLoading || showFeedback

  return (
    <StyledButton
      ref={ref}
      type={type}
      disabled={isInteractionDisabled}
      onClick={handleClick}
      className={className}
      style={style}
      $variant={variant}
      $size={size}
      $isLoading={isLoading}
      $feedbackState={currentFeedback}
      $showFeedback={showFeedback}
      whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}}
      {...props}
    >
      {/* Loading state */}
      {isLoading && <LoadingSpinner className="loading-spinner" />}
      
      {/* Feedback icons */}
      {showFeedback && currentFeedback && (
        <FeedbackIcon 
          className={`feedback-icon ${currentFeedback}`}
          aria-label={currentFeedback === 'success' ? '성공' : '오류'}
        />
      )}
      
      {/* Ripple effect */}
      {enableRipple && (
        <ButtonRippleContainer className="button-ripple">
          <RippleEffect color={rippleColor} />
        </ButtonRippleContainer>
      )}
      
      {/* Button content */}
      {children}
    </StyledButton>
  )
})

Button.displayName = 'Button'

export default Button