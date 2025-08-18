import React from 'react'
import { Divider as MantineDivider, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, color, orientation }) => ({
  divider: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'thin' && {
      borderWidth: '1px',
    }),
    ...(size === 'thick' && {
      borderWidth: '3px',
    }),
  },

  // Game-specific variants
  game: {
    borderColor: theme.colors.blue[4],
    '&::before': {
      borderColor: theme.colors.blue[4],
    },
  },

  section: {
    borderColor: theme.colors.gray[4],
    '&::before': {
      borderColor: theme.colors.gray[4],
    },
  },

  victory: {
    borderColor: theme.colors.green[4],
    '&::before': {
      borderColor: theme.colors.green[4],
    },
  },

  defeat: {
    borderColor: theme.colors.red[4],
    '&::before': {
      borderColor: theme.colors.red[4],
    },
  },
}))

// Divider component
export const Divider = ({ 
  children, 
  variant = 'default',
  size = 'md',
  color,
  orientation = 'horizontal',
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size, color, orientation })

  // Map size to Mantine size
  const getMantineSize = () => {
    switch (size) {
      case 'thin':
        return 'xs'
      case 'thick':
        return 'lg'
      default:
        return 'md'
    }
  }

  // Map variant to color
  const getVariantColor = () => {
    if (color) return color
    
    switch (variant) {
      case 'game':
        return 'blue'
      case 'section':
        return 'gray'
      case 'victory':
        return 'green'
      case 'defeat':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <MantineDivider
      className={cx(className, classes.divider)}
      size={getMantineSize()}
      color={getVariantColor()}
      orientation={orientation}
      {...props}
    >
      {children}
    </MantineDivider>
  )
}

Divider.displayName = 'Divider'

export default Divider