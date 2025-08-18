import React from 'react'
import { Box as MantineBox, Container as MantineContainer, Stack as MantineStack, Grid as MantineGrid } from '@mantine/core'

const layoutBase = (spacing, align, justify) => ({
  display: 'flex',
  gap: spacing === 'tight' ? 'var(--mantine-spacing-xs)' : spacing === 'loose' ? 'var(--mantine-spacing-lg)' : 'var(--mantine-spacing-md)',
  alignItems: align === 'start' ? 'flex-start' : align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'stretch',
  justifyContent:
    justify === 'start' ? 'flex-start' :
    justify === 'center' ? 'center' :
    justify === 'end' ? 'flex-end' :
    justify === 'space-between' ? 'space-between' :
    justify === 'space-around' ? 'space-around' : 'flex-start',
})

const gameStyle = {
  background: 'linear-gradient(135deg, var(--mantine-color-gray-0), var(--mantine-color-gray-1))',
  borderRadius: 'var(--mantine-radius-md)',
  padding: 'var(--mantine-spacing-md)'
}

// Box component
export const Box = ({ 
  children, 
  variant = 'default',
  spacing,
  align,
  justify,
  className = '',
  ...props 
}) => {
  const style = { ...layoutBase(spacing, align, justify), ...(variant === 'game' ? gameStyle : {}) }

  return (
    <MantineBox className={className} style={style} {...props}>
      {children}
    </MantineBox>
  )
}

// Container component
export const Container = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const style = variant === 'game' ? gameStyle : undefined

  return (
    <MantineContainer className={className} size={size} style={style} {...props}>
      {children}
    </MantineContainer>
  )
}

// Stack component
export const Stack = ({ 
  children, 
  variant = 'default',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props 
}) => {
  const style = { ...layoutBase(spacing, align, justify), ...(variant === 'game' ? gameStyle : {}) }

  return (
    <MantineStack className={className} gap={spacing} align={align} justify={justify} style={style} {...props}>
      {children}
    </MantineStack>
  )
}

// Grid component
export const Grid = ({ 
  children, 
  variant = 'default',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props 
}) => {
  const style = { ...(variant === 'game' ? gameStyle : {}) }

  return (
    <MantineGrid className={className} gutter={spacing} align={align} justify={justify} style={style} {...props}>
      {children}
    </MantineGrid>
  )
}

// Center component
export const Center = ({ 
  children, 
  className = '',
  ...props 
}) => {
  const centerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%' }

  return (
    <div className={className} style={centerStyle} {...props}>
      {children}
    </div>
  )
}

// Spacer component
export const Spacer = ({ className = '', ...props }) => {
  const spacerStyle = { flex: 1 }

  return (
    <div className={className} style={spacerStyle} {...props} />
  )
}

export default Box