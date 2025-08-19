import React, {useMemo} from 'react'
import {
    Box as MantineBox,
    Container as MantineContainer,
    Grid as MantineGrid,
    Stack as MantineStack
} from '@mantine/core'

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

const filterTransientProps = (props) => {
    const transientProps = {};
    for (const key in props) {
      if (!key.startsWith('$')) {
        transientProps[key] = props[key];
      }
    }
    return transientProps;
  };

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
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <MantineBox className={className} style={style} {...filteredProps}>
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
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <MantineContainer className={className} size={size} style={style} {...filteredProps}>
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
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <MantineStack className={className} gap={spacing} align={align} justify={justify} style={style} {...filteredProps}>
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
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <MantineGrid className={className} gutter={spacing} align={align} justify={justify} style={style} {...filteredProps}>
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
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <div className={className} style={centerStyle} {...filteredProps}>
      {children}
    </div>
  )
}

// Spacer component
export const Spacer = ({ className = '', ...props }) => {
  const spacerStyle = { flex: 1 }
  const filteredProps = useMemo(() => filterTransientProps(props), [props])

  return (
    <div className={className} style={spacerStyle} {...filteredProps} />
  )
}

export default Box