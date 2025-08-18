import React from 'react'
import { Chip as MantineChip, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, color }) => ({
  chip: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'small' && {
      fontSize: theme.fontSizes.xs,
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    }),
    ...(size === 'large' && {
      fontSize: theme.fontSizes.lg,
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
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
    color: theme.colors.green[8],
    '&:hover': {
      borderColor: theme.colors.green[5],
      background: `linear-gradient(135deg, ${theme.colors.green[1]}, ${theme.colors.green[2]})`,
    },
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[0]}, ${theme.colors.red[1]})`,
    border: `2px solid ${theme.colors.red[4]}`,
    color: theme.colors.red[8],
    '&:hover': {
      borderColor: theme.colors.red[5],
      background: `linear-gradient(135deg, ${theme.colors.red[1]}, ${theme.colors.red[2]})`,
    },
  },

  role: {
    background: `linear-gradient(135deg, ${theme.colors.blue[0]}, ${theme.colors.blue[1]})`,
    border: `2px solid ${theme.colors.blue[4]}`,
    color: theme.colors.blue[8],
    '&:hover': {
      borderColor: theme.colors.blue[5],
      background: `linear-gradient(135deg, ${theme.colors.blue[1]}, ${theme.colors.blue[2]})`,
    },
  },
}))

// Chip component
export const Chip = ({ 
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
      case 'victory':
        return 'green'
      case 'defeat':
        return 'red'
      case 'role':
        return 'blue'
      case 'game':
        return 'gray'
      default:
        return 'blue'
    }
  }

  return (
    <MantineChip
      className={cx(className, classes.chip)}
      size={size}
      color={getVariantColor()}
      variant="filled"
      {...props}
    >
      {children}
    </MantineChip>
  )
}

Chip.displayName = 'Chip'

export default Chip