import React from 'react'
import { Anchor as MantineAnchor, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, color }) => ({
  link: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'small' && {
      fontSize: theme.fontSizes.sm,
    }),
    ...(size === 'large' && {
      fontSize: theme.fontSizes.lg,
    }),
  },

  // Game-specific variants
  game: {
    color: theme.colors.blue[6],
    '&:hover': {
      color: theme.colors.blue[7],
      textDecoration: 'underline',
    },
  },

  navigation: {
    color: theme.colors.gray[7],
    fontWeight: 500,
    '&:hover': {
      color: theme.colors.blue[6],
      textDecoration: 'none',
    },
  },

  action: {
    color: theme.colors.blue[6],
    fontWeight: 600,
    '&:hover': {
      color: theme.colors.blue[7],
      textDecoration: 'underline',
      transform: 'translateY(-1px)',
    },
  },
}))

// Link component
export const Link = ({ 
  children, 
  variant = 'default',
  size = 'md',
  color,
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size, color })

  // Map variant to color
  const getVariantColor = () => {
    if (color) return color
    
    switch (variant) {
      case 'game':
        return 'blue'
      case 'navigation':
        return 'gray'
      case 'action':
        return 'blue'
      default:
        return 'blue'
    }
  }

  return (
    <MantineAnchor
      className={cx(className, classes.link)}
      size={size}
      color={getVariantColor()}
      underline="hover"
      {...props}
    >
      {children}
    </MantineAnchor>
  )
}

Link.displayName = 'Link'

export default Link