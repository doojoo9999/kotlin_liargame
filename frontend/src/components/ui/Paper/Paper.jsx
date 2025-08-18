import React from 'react'
import { Paper as MantinePaper, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, elevation, interactive }) => ({
  paper: {
    transition: 'all 0.2s ease',
    
    // Interactive variants
    ...(interactive && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.lg,
      },
      '&:active': {
        transform: 'translateY(-1px)',
        boxShadow: theme.shadows.md,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.colors.blue[6]}`,
        outlineOffset: '2px',
      },
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    '&:hover': {
      borderColor: theme.colors.blue[4],
      background: `linear-gradient(135deg, ${theme.colors.blue[0]}, ${theme.colors.blue[1]})`,
    },
  },

  victory: {
    background: `linear-gradient(135deg, ${theme.colors.green[0]}, ${theme.colors.green[1]})`,
    border: `2px solid ${theme.colors.green[4]}`,
    '&:hover': {
      borderColor: theme.colors.green[5],
      background: `linear-gradient(135deg, ${theme.colors.green[1]}, ${theme.colors.green[2]})`,
    },
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[0]}, ${theme.colors.red[1]})`,
    border: `2px solid ${theme.colors.red[4]}`,
    '&:hover': {
      borderColor: theme.colors.red[5],
      background: `linear-gradient(135deg, ${theme.colors.red[1]}, ${theme.colors.red[2]})`,
    },
  },
}))

// Paper component
export const Paper = ({ 
  children, 
  variant = 'default',
  elevation = 'md',
  interactive = false,
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, elevation, interactive })

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

  return (
    <MantinePaper
      className={cx(className, classes.paper)}
      shadow={getShadow()}
      withBorder
      {...props}
    >
      {children}
    </MantinePaper>
  )
}

Paper.displayName = 'Paper'

export default Paper