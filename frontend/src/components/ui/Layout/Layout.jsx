import React from 'react'
import { Box as MantineBox, Container as MantineContainer, Stack as MantineStack, Grid as MantineGrid, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, spacing, align, justify }) => ({
  layout: {
    // Custom spacing variants
    ...(spacing === 'tight' && {
      gap: theme.spacing.xs,
    }),
    ...(spacing === 'normal' && {
      gap: theme.spacing.md,
    }),
    ...(spacing === 'loose' && {
      gap: theme.spacing.lg,
    }),
    
    // Custom alignment variants
    ...(align === 'start' && {
      alignItems: 'flex-start',
    }),
    ...(align === 'center' && {
      alignItems: 'center',
    }),
    ...(align === 'end' && {
      alignItems: 'flex-end',
    }),
    ...(align === 'stretch' && {
      alignItems: 'stretch',
    }),
    
    // Custom justify variants
    ...(justify === 'start' && {
      justifyContent: 'flex-start',
    }),
    ...(justify === 'center' && {
      justifyContent: 'center',
    }),
    ...(justify === 'end' && {
      justifyContent: 'flex-end',
    }),
    ...(justify === 'space-between' && {
      justifyContent: 'space-between',
    }),
    ...(justify === 'space-around' && {
      justifyContent: 'space-around',
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },

  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },

  spacer: {
    flex: 1,
  },
}))

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
  const { classes, cx } = useStyles({ variant, spacing, align, justify })

  return (
    <MantineBox
      className={cx(className, classes.layout)}
      {...props}
    >
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
  const { classes, cx } = useStyles({ variant })

  return (
    <MantineContainer
      className={cx(className, classes.layout)}
      size={size}
      {...props}
    >
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
  const { classes, cx } = useStyles({ variant, spacing, align, justify })

  return (
    <MantineStack
      className={cx(className, classes.layout)}
      gap={spacing}
      align={align}
      justify={justify}
      {...props}
    >
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
  const { classes, cx } = useStyles({ variant, spacing, align, justify })

  return (
    <MantineGrid
      className={cx(className, classes.layout)}
      gutter={spacing}
      align={align}
      justify={justify}
      {...props}
    >
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
  const { classes, cx } = useStyles({})

  return (
    <div
      className={cx(className, classes.center)}
      {...props}
    >
      {children}
    </div>
  )
}

// Spacer component
export const Spacer = ({ className = '', ...props }) => {
  const { classes, cx } = useStyles({})

  return (
    <div
      className={cx(className, classes.spacer)}
      {...props}
    />
  )
}

export default Box