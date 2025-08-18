import React from 'react'
import { Snackbar as MantineSnackbar, createStyles } from '@mantine/core'
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react'

const useStyles = createStyles((theme, { variant, position }) => ({
  snackbar: {
    transition: 'all 0.3s ease',
    
    // Custom position variants
    ...(position === 'top' && {
      top: theme.spacing.md,
    }),
    ...(position === 'bottom' && {
      bottom: theme.spacing.md,
    }),
  },

  // Game-specific variants
  game: {
    background: `linear-gradient(135deg, ${theme.colors.gray[0]}, ${theme.colors.gray[1]})`,
    border: `2px solid ${theme.colors.gray[3]}`,
    borderRadius: theme.radius.lg,
  },

  victory: {
    background: `linear-gradient(135deg, ${theme.colors.green[0]}, ${theme.colors.green[1]})`,
    border: `2px solid ${theme.colors.green[4]}`,
    color: theme.colors.green[8],
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[0]}, ${theme.colors.red[1]})`,
    border: `2px solid ${theme.colors.red[4]}`,
    color: theme.colors.red[8],
  },
}))

// Snackbar component
export const Snackbar = ({ 
  children, 
  severity = 'info',
  variant = 'default',
  position = 'bottom',
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, position })

  // Map severity to Mantine color and icon
  const getSeverityProps = () => {
    switch (severity) {
      case 'success':
        return {
          color: 'green',
          icon: <IconCheck size={16} />,
        }
      case 'error':
        return {
          color: 'red',
          icon: <IconX size={16} />,
        }
      case 'warning':
        return {
          color: 'yellow',
          icon: <IconAlertTriangle size={16} />,
        }
      case 'info':
      default:
        return {
          color: 'blue',
          icon: <IconInfoCircle size={16} />,
        }
    }
  }

  const severityProps = getSeverityProps()

  return (
    <MantineSnackbar
      className={cx(className, classes.snackbar)}
      color={severityProps.color}
      icon={severityProps.icon}
      {...props}
    >
      {children}
    </MantineSnackbar>
  )
}

Snackbar.displayName = 'Snackbar'

export default Snackbar