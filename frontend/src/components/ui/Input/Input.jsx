import React, { forwardRef } from 'react'
import { TextInput, createStyles } from '@mantine/core'
import { motion } from 'framer-motion'

const useStyles = createStyles((theme, { variant, size, error, focused }) => ({
  input: {
    transition: 'all 0.2s ease',
    
    // Focus state
    ...(focused && {
      transform: 'scale(1.02)',
      boxShadow: theme.shadows.md,
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    '&:focus': {
      borderColor: theme.colors.blue[6],
      background: `linear-gradient(135deg, ${theme.colors.blue[0]}, ${theme.colors.blue[1]})`,
    },
  },

  chat: {
    background: theme.colors.gray[0],
    border: `2px solid ${theme.colors.gray[3]}`,
    borderRadius: theme.radius.xl,
    '&:focus': {
      borderColor: theme.colors.blue[6],
      background: theme.white,
    },
  },

  // Error state
  error: {
    borderColor: theme.colors.red[6],
    '&:focus': {
      borderColor: theme.colors.red[7],
      boxShadow: `0 0 0 2px ${theme.colors.red[1]}`,
    },
  },
}))

// Input component
export const Input = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  error,
  className = '',
  style = {},
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [focused, setFocused] = React.useState(false)
  const { classes, cx } = useStyles({ variant, size, error, focused })

  const handleFocus = (e) => {
    setFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setFocused(false)
    onBlur?.(e)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={classes.input}
    >
      <TextInput
        ref={ref}
        className={cx(className, classes.input)}
        style={style}
        size={size}
        error={error}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </TextInput>
    </motion.div>
  )
})

Input.displayName = 'Input'

export default Input