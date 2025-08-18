import React from 'react'
import { List as MantineList, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size, spacing }) => ({
  list: {
    transition: 'all 0.2s ease',
    
    // Custom spacing variants
    ...(spacing === 'tight' && {
      gap: theme.spacing.xs,
    }),
    ...(spacing === 'loose' && {
      gap: theme.spacing.lg,
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },

  players: {
    '& .mantine-List-item': {
      border: `1px solid ${theme.colors.gray[3]}`,
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing.xs,
      '&:hover': {
        borderColor: theme.colors.blue[4],
        background: theme.colors.blue[0],
      },
    },
  },

  chat: {
    '& .mantine-List-item': {
      borderBottom: `1px solid ${theme.colors.gray[2]}`,
      paddingBottom: theme.spacing.sm,
      '&:last-child': {
        borderBottom: 'none',
      },
    },
  },
}))

// List component
export const List = ({ 
  children, 
  variant = 'default',
  size = 'md',
  spacing = 'normal',
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size, spacing })

  return (
    <MantineList
      className={cx(className, classes.list)}
      size={size}
      spacing={spacing}
      {...props}
    >
      {children}
    </MantineList>
  )
}

// List sub-components
export const ListItem = ({ children, className, ...props }) => (
  <MantineList.Item className={className} {...props}>
    {children}
  </MantineList.Item>
)

export const ListItemIcon = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const ListItemText = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

List.displayName = 'List'

export default List