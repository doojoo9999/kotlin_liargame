import React from 'react'
import styled, {keyframes} from 'styled-components'
import {animations, borderRadius, colors, spacing} from '@/styles'

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} ${animations.duration.medium} ${animations.easing.easeOut};
`

const DialogContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${colors.surface.primary};
  border-radius: ${borderRadius.large};
  box-shadow: 0 24px 38px rgba(0, 0, 0, 0.14), 0 9px 46px rgba(0, 0, 0, 0.12), 0 11px 15px rgba(0, 0, 0, 0.20);
  min-width: 280px;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideIn} ${animations.duration.medium} ${animations.easing.easeOut};
  
  @media (max-width: 600px) {
    margin: ${spacing.md};
    max-width: calc(100vw - ${spacing.lg});
  }
`

const DialogTitleContainer = styled.div`
  padding: ${spacing.lg} ${spacing.lg} ${spacing.md};
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${colors.text.primary};
  }
`

const DialogContentContainer = styled.div`
  padding: 0 ${spacing.lg} ${spacing.lg};
  color: ${colors.text.secondary};
  
  p {
    margin: 0 0 ${spacing.md} 0;
    line-height: 1.5;
  }
  
  &:last-child {
    padding-bottom: ${spacing.lg};
  }
`

const DialogActionsContainer = styled.div`
  padding: ${spacing.md} ${spacing.lg} ${spacing.lg};
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};
  
  @media (max-width: 600px) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`

export const Dialog = React.forwardRef(({ 
  open, 
  onClose, 
  children, 
  className,
  maxWidth = 'sm',
  ...props 
}, ref) => {
  if (!open) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.()
    }
  }

  return (
    <DialogOverlay onClick={handleOverlayClick}>
      <DialogContainer 
        ref={ref} 
        className={className} 
        role="dialog" 
        aria-modal="true"
        {...props}
      >
        {children}
      </DialogContainer>
    </DialogOverlay>
  )
})

export const DialogTitle = React.forwardRef(({ children, className, ...props }, ref) => (
  <DialogTitleContainer ref={ref} className={className} {...props}>
    <h2>{children}</h2>
  </DialogTitleContainer>
))

export const DialogContent = React.forwardRef(({ children, className, ...props }, ref) => (
  <DialogContentContainer ref={ref} className={className} {...props}>
    {children}
  </DialogContentContainer>
))

export const DialogActions = React.forwardRef(({ children, className, ...props }, ref) => (
  <DialogActionsContainer ref={ref} className={className} {...props}>
    {children}
  </DialogActionsContainer>
))

// Simple text wrapper for dialog content
export const DialogContentText = React.forwardRef(({ children, className, ...props }, ref) => (
  <p ref={ref} className={className} {...props}>
    {children}
  </p>
))

// Display names for debugging
Dialog.displayName = 'Dialog'
DialogTitle.displayName = 'DialogTitle'
DialogContent.displayName = 'DialogContent'
DialogActions.displayName = 'DialogActions'
DialogContentText.displayName = 'DialogContentText'