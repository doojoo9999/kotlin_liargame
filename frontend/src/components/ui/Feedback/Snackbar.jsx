import React from 'react'
import { Notification as MantineNotification } from '@mantine/core'
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react'

// Snackbar component (mapped to Mantine Notification)
export const Snackbar = ({ 
  children, 
  severity = 'info',
  variant = 'default',
  position = 'bottom',
  className = '',
  ...props 
}) => {
  const getSeverityProps = () => {
    switch (severity) {
      case 'success':
        return { color: 'green', icon: <IconCheck size={16} /> }
      case 'error':
        return { color: 'red', icon: <IconX size={16} /> }
      case 'warning':
        return { color: 'yellow', icon: <IconAlertTriangle size={16} /> }
      case 'info':
      default:
        return { color: 'blue', icon: <IconInfoCircle size={16} /> }
    }
  }

  const severityProps = getSeverityProps()
  const style = { transition: 'all 0.3s ease' }

  return (
    <MantineNotification className={className} color={severityProps.color} icon={severityProps.icon} style={style} {...props}>
      {children}
    </MantineNotification>
  )
}

Snackbar.displayName = 'Snackbar'

export default Snackbar