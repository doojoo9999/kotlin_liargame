import React from 'react'
import { Alert as MantineAlert } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconInfoCircle, IconX } from '@tabler/icons-react'

const wrapperStyle = (size) => ({
  transition: 'all 0.2s ease',
  ...(size === 'small' && { padding: 'var(--mantine-spacing-xs)', fontSize: 'var(--mantine-font-size-sm)' }),
  ...(size === 'large' && { padding: 'var(--mantine-spacing-lg)', fontSize: 'var(--mantine-font-size-lg)' }),
})

// Alert component
export const Alert = ({ 
  children, 
  severity = 'info',
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const style = wrapperStyle(size)

  // Map severity to Mantine color and icon
  const getSeverityProps = () => {
    switch (severity) {
      case 'success':
        return {
          color: 'green',
          icon: <IconCircleCheck size={16} />,
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
    <MantineAlert className={className} color={severityProps.color} icon={severityProps.icon} style={style} {...props}>
      {children}
    </MantineAlert>
  )
}

Alert.displayName = 'Alert'

export default Alert