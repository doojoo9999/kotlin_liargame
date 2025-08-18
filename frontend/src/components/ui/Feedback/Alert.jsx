import React from 'react'
import { Alert as MantineAlert, createStyles } from '@mantine/core'
import { IconAlertCircle, IconCheckCircle, IconInfoCircle, IconX } from '@tabler/icons-react'

const useStyles = createStyles((theme, { variant, size }) => ({
  alert: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'small' && {
      padding: theme.spacing.xs,
      fontSize: theme.fontSizes.sm,
    }),
    ...(size === 'large' && {
      padding: theme.spacing.lg,
      fontSize: theme.fontSizes.lg,
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

// Alert component
export const Alert = ({ 
  children, 
  severity = 'info',
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size })

  // Map severity to Mantine color and icon
  const getSeverityProps = () => {
    switch (severity) {
      case 'success':
        return {
          color: 'green',
          icon: <IconCheckCircle size={16} />,
        }
      case 'error':
        return {
          color: 'red',
          icon: <IconX size={16} />,
        }
      case 'warning':
        return {
          color: 'yellow',
          icon: <IconAlertCircle size={16} />,
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
    <MantineAlert
      className={cx(className, classes.alert)}
      color={severityProps.color}
      icon={severityProps.icon}
      {...props}
    >
      {children}
    </MantineAlert>
  )
}

Alert.displayName = 'Alert'

export default Alert