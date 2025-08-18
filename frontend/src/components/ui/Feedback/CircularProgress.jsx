import React from 'react'
import { Loader as MantineLoader } from '@mantine/core'

// CircularProgress component
export const CircularProgress = ({ 
  children, 
  variant = 'default',
  size = 'md',
  color,
  className = '',
  ...props 
}) => {
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

  const style = { transition: 'all 0.2s ease' }

  return (
    <MantineLoader className={className} size={getMantineSize()} color={getVariantColor()} style={style} {...props} />
  )
}

CircularProgress.displayName = 'CircularProgress'

export default CircularProgress