import React, { forwardRef } from 'react'
import { Button as MantineButton } from '@mantine/core'
import { motion } from 'framer-motion'
import { IconCheck, IconX, IconLoader } from '@tabler/icons-react'
import { getButtonStyles, getVariantStyles, feedbackIconStyles } from './Button.styles'
import './Button.animations.css'

// Button component
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
  // Enhanced interaction props
  feedbackState = null, // null | 'success' | 'error'
  feedbackDuration = 1000,
  ...props
}, ref) => {
  const [currentFeedback, setCurrentFeedback] = React.useState(null)
  const [showFeedback, setShowFeedback] = React.useState(false)

  // Handle feedback state changes
  React.useEffect(() => {
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
    onClick?.(e)
  }

  const isInteractionDisabled = disabled || isLoading || showFeedback

  // Map custom variants to Mantine variants
  const getMantineVariant = () => {
    if (['liar', 'citizen', 'action'].includes(variant)) {
      return 'filled'
    }
    return variant
  }

  // Get custom styles for game variants
  const getCustomStyles = () => {
    if (['liar', 'citizen', 'action'].includes(variant)) {
      return { [variant]: true }
    }
    return {}
  }

  // 스타일 계산
  const buttonStyles = getButtonStyles(variant, currentFeedback, showFeedback)
  const variantStyles = getVariantStyles(variant)

  return (
    <motion.div
      whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}}
      style={buttonStyles}
    >
      <MantineButton
        ref={ref}
        type={type}
        disabled={isInteractionDisabled}
        onClick={handleClick}
        className={className}
        style={{ ...style, ...variantStyles }}
        variant={getMantineVariant()}
        size={size}
        loading={isLoading}
        leftSection={isLoading ? <IconLoader size={16} /> : undefined}
        {...getCustomStyles()}
        {...props}
      >
        {children}
      </MantineButton>

      {/* Feedback icons */}
      {showFeedback && currentFeedback && (
        <div style={feedbackIconStyles}>
          {currentFeedback === 'success' ? (
            <IconCheck size={20} color="green" />
          ) : (
            <IconX size={20} color="red" />
          )}
        </div>
      )}
    </motion.div>
  )
})

Button.displayName = 'Button'

export default Button