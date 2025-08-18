import React from 'react'
import { Paper as MantinePaper } from '@mantine/core'

// Paper component
export const Paper = ({ 
  children, 
  variant = 'default',
  elevation = 'md',
  interactive = false,
  className = '',
  ...props 
}) => {
  // Map elevation to Mantine shadow
  const getShadow = () => {
    switch (elevation) {
      case 'none':
        return 'none'
      case 'xs':
        return 'xs'
      case 'sm':
        return 'sm'
      case 'md':
        return 'md'
      case 'lg':
        return 'lg'
      case 'xl':
        return 'xl'
      default:
        return 'md'
    }
  }

  const wrapperStyle = interactive ? { transition: 'transform 0.2s ease', cursor: 'pointer' } : undefined

  return (
    <MantinePaper
      className={className}
      shadow={getShadow()}
      withBorder
      style={wrapperStyle}
      {...props}
    >
      {children}
    </MantinePaper>
  )
}

Paper.displayName = 'Paper'

export default Paper