import React from 'react'
import { Text as MantineText, Title as MantineTitle, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, color, weight, align }) => ({
  text: {
    // Custom color variants
    ...(color === 'primary' && {
      color: theme.colors.blue[6],
    }),
    ...(color === 'secondary' && {
      color: theme.colors.gray[6],
    }),
    ...(color === 'success' && {
      color: theme.colors.green[6],
    }),
    ...(color === 'error' && {
      color: theme.colors.red[6],
    }),
    ...(color === 'warning' && {
      color: theme.colors.yellow[6],
    }),
    
    // Custom weight variants
    ...(weight === 'light' && {
      fontWeight: 300,
    }),
    ...(weight === 'normal' && {
      fontWeight: 400,
    }),
    ...(weight === 'medium' && {
      fontWeight: 500,
    }),
    ...(weight === 'semibold' && {
      fontWeight: 600,
    }),
    ...(weight === 'bold' && {
      fontWeight: 700,
    }),
    
    // Text alignment
    ...(align === 'left' && {
      textAlign: 'left',
    }),
    ...(align === 'center' && {
      textAlign: 'center',
    }),
    ...(align === 'right' && {
      textAlign: 'right',
    }),
    ...(align === 'justify' && {
      textAlign: 'justify',
    }),
  },

  // Game-specific variants
  game: {
    fontFamily: theme.fontFamilyMonospace,
    letterSpacing: '0.05em',
  },

  victory: {
    background: `linear-gradient(135deg, ${theme.colors.yellow[6]}, ${theme.colors.orange[6]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 700,
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[6]}, ${theme.colors.pink[6]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 700,
  },
}))

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
  const { classes, cx } = useStyles({ variant, color, weight, align })

  return (
    <MantineText
      className={cx(className, classes.text)}
      {...props}
    >
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
  const { classes, cx } = useStyles({ variant, color, weight, align })

  return (
    <MantineTitle
      className={cx(className, classes.text)}
      {...props}
    >
      {children}
    </MantineTitle>
  )
}

// Typography component (alias for Text)
export const Typography = Text

export default Typography