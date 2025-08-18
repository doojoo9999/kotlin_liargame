import React from 'react'
import { CircularProgress as MantineCircularProgress, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, color }) => ({
  progress: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'small' && {
      width: 24,
      height: 24,
    }),
    ...(size === 'large' && {
      width: 80,
      height: 80,
    }),
  },

  // Game-specific variants
  game: {
    '& .mantine-CircularProgress-section': {
      stroke: theme.colors.blue[6],
    },
  },

  victory: {
    '& .mantine-CircularProgress-section': {
      stroke: theme.colors.green[6],
    },
  },

  defeat: {
    '& .mantine-CircularProgress-section': {
      stroke: theme.colors.red[6],
    },
  },

  timer: {
    '& .mantine-CircularProgress-section': {
      stroke: theme.colors.orange[6],
    },
  },
}))

// CircularProgress component
export const CircularProgress = ({ 
  children, 
  variant = 'default',
  size = 'md',
  color,
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size, color })

  // Map size to Mantine size
  const getMantineSize = () => {
    switch (size) {
      case 'small':
        return 24
      case 'large':
        return 80
      default:
        return 40
    }
  }

  // Map variant to color
  const getVariantColor = () => {
    if (color) return color
    
    switch (variant) {
      case 'victory':
        return 'green'
      case 'defeat':
        return 'red'
      case 'timer':
        return 'orange'
      case 'game':
        return 'blue'
      default:
        return 'blue'
    }
  }

  return (
    <MantineCircularProgress
      className={cx(className, classes.progress)}
      size={getMantineSize()}
      color={getVariantColor()}
      {...props}
    >
      {children}
    </MantineCircularProgress>
  )
}

CircularProgress.displayName = 'CircularProgress'

export default CircularProgress