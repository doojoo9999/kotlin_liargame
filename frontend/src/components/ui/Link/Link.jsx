import React from 'react'
import { Anchor as MantineAnchor } from '@mantine/core'

// Link component
export const Link = ({ 
  children, 
  variant = 'default',
  size = 'md',
  color,
  className = '',
  ...props 
}) => {
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

  const fw = variant === 'navigation' ? 500 : variant === 'action' ? 600 : undefined

  return (
    <MantineAnchor
      className={className}
      size={size}
      c={getVariantColor()}
      fw={fw}
      underline="hover"
      {...props}
    >
      {children}
    </MantineAnchor>
  )
}

Link.displayName = 'Link'

export default Link