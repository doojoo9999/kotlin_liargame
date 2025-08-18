import React from 'react'
import { Modal as MantineModal, createStyles } from '@mantine/core'

const useStyles = createStyles((theme, { variant, size }) => ({
  dialog: {
    transition: 'all 0.2s ease',
    
    // Custom size variants
    ...(size === 'small' && {
      maxWidth: 400,
    }),
    ...(size === 'large' && {
      maxWidth: 800,
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
  },

  defeat: {
    background: `linear-gradient(135deg, ${theme.colors.red[0]}, ${theme.colors.red[1]})`,
    border: `2px solid ${theme.colors.red[4]}`,
  },
}))

// Dialog component
export const Dialog = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  ...props 
}) => {
  const { classes, cx } = useStyles({ variant, size })

  return (
    <MantineModal
      className={cx(className, classes.dialog)}
      size={size}
      {...props}
    >
      {children}
    </MantineModal>
  )
}

// Dialog sub-components
export const DialogTitle = ({ children, className, ...props }) => (
  <MantineModal.Title className={className} {...props}>
    {children}
  </MantineModal.Title>
)

export const DialogContent = ({ children, className, ...props }) => (
  <MantineModal.Body className={className} {...props}>
    {children}
  </MantineModal.Body>
)

export const DialogActions = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

export const DialogContentText = ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
)

Dialog.displayName = 'Dialog'

export default Dialog