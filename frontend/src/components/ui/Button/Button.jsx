import React, { forwardRef } from 'react'
import { Button as MantineButton, createStyles } from '@mantine/core'
import { motion } from 'framer-motion'
import { IconCheck, IconX, IconLoader } from '@tabler/icons-react'

const useStyles = createStyles((theme, { variant, size, feedbackState, showFeedback }) => ({
  button: {
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    
    // Feedback state animations
    ...(feedbackState === 'error' && {
      animation: 'shake 0.5s ease-in-out',
    }),
    
    ...(feedbackState === 'success' && {
      animation: 'successPulse 0.5s ease-out',
    }),
    
    // Hide content during feedback display
    ...(showFeedback && {
      '& > *:not(.feedback-icon)': {
        opacity: 0,
      },
    }),
  },

  // Game-specific variants
  liar: {
    backgroundColor: theme.colors.red[6],
    color: theme.white,
    '&:hover': {
      backgroundColor: theme.colors.red[7],
      transform: 'translateY(-1px) scale(1.02)',
    },
    '&:active': {
      backgroundColor: theme.colors.red[8],
      transform: 'translateY(0) scale(1)',
    },
  },

  citizen: {
    backgroundColor: theme.colors.blue[6],
    color: theme.white,
    '&:hover': {
      backgroundColor: theme.colors.blue[7],
      transform: 'translateY(-1px) scale(1.02)',
    },
    '&:active': {
      backgroundColor: theme.colors.blue[8],
      transform: 'translateY(0) scale(1)',
    },
  },

  action: {
    background: `linear-gradient(135deg, ${theme.colors.blue[6]}, ${theme.colors.cyan[6]})`,
    color: theme.white,
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.colors.blue[7]}, ${theme.colors.cyan[7]})`,
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: theme.shadows.lg,
    },
    '&:active': {
      transform: 'translateY(-1px) scale(1.01)',
      boxShadow: theme.shadows.md,
    },
  },

  feedbackIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  },

  '@keyframes shake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },

  '@keyframes successPulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' },
  },
}))

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

  const { classes, cx } = useStyles({ 
    variant, 
    size, 
    feedbackState: currentFeedback, 
    showFeedback 
  })

  return (
    <motion.div
      whileTap={!isInteractionDisabled ? { scale: 0.98 } : {}}
      className={classes.button}
    >
      <MantineButton
        ref={ref}
        type={type}
        disabled={isInteractionDisabled}
        onClick={handleClick}
        className={cx(className, classes.button)}
        style={style}
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
        <div className={classes.feedbackIcon}>
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