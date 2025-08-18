import React from 'react'
import { Text as MantineText, Title as MantineTitle } from '@mantine/core'

// Helpers
const mapColor = (color) => {
  switch (color) {
    case 'primary':
      return 'blue'
    case 'secondary':
      return 'gray'
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'warning':
      return 'yellow'
    default:
      return undefined
  }
}

const mapWeight = (weight) => {
  switch (weight) {
    case 'light':
      return 300
    case 'normal':
      return 400
    case 'medium':
      return 500
    case 'semibold':
      return 600
    case 'bold':
      return 700
    default:
      return undefined
  }
}

// Text component
export const Text = ({ 
  children, 
  variant = 'default',
  color,
  weight,
  align,
  className = '',
  ...props 
}) => {
  const c = mapColor(color)
  const fw = mapWeight(weight)

  // Variants
  if (variant === 'victory') {
    return (
      <MantineText variant="gradient" gradient={{ from: 'yellow', to: 'orange', deg: 135 }} fw={700} className={className} ta={align} {...props}>
        {children}
      </MantineText>
    )
  }
  if (variant === 'defeat') {
    return (
      <MantineText variant="gradient" gradient={{ from: 'red', to: 'pink', deg: 135 }} fw={700} className={className} ta={align} {...props}>
        {children}
      </MantineText>
    )
  }

  const style = variant === 'game' ? { letterSpacing: '0.05em', fontFamily: 'var(--mantine-font-family-monospace)' } : undefined

  return (
    <MantineText c={c} fw={fw} className={className} ta={align} style={style} {...props}>
      {children}
    </MantineText>
  )
}

// Title component
export const Title = ({ 
  children, 
  variant = 'default',
  color,
  weight,
  align,
  className = '',
  ...props 
}) => {
  const c = mapColor(color)
  const fw = mapWeight(weight)

  if (variant === 'victory') {
    return (
      <MantineTitle variant="gradient" gradient={{ from: 'yellow', to: 'orange', deg: 135 }} fw={700} className={className} ta={align} {...props}>
        {children}
      </MantineTitle>
    )
  }
  if (variant === 'defeat') {
    return (
      <MantineTitle variant="gradient" gradient={{ from: 'red', to: 'pink', deg: 135 }} fw={700} className={className} ta={align} {...props}>
        {children}
      </MantineTitle>
    )
  }

  const style = variant === 'game' ? { letterSpacing: '0.05em', fontFamily: 'var(--mantine-font-family-monospace)' } : undefined

  return (
    <MantineTitle c={c} fw={fw} className={className} ta={align} style={style} {...props}>
      {children}
    </MantineTitle>
  )
}

// Typography component (alias for Text)
export const Typography = Text

export default Typography