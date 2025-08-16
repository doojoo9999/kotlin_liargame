import React, {useEffect, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {animations, borderRadius, colors, spacing} from '@/styles'

// Animation keyframes
const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-100%);
    opacity: 0;
  }
`

const SnackbarContainer = styled.div`
  position: fixed;
  top: ${spacing.lg};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  
  ${props => props.$anchorOrigin?.vertical === 'bottom' && css`
    top: auto;
    bottom: ${spacing.lg};
  `}
  
  ${props => props.$anchorOrigin?.horizontal === 'left' && css`
    left: ${spacing.lg};
    transform: translateX(0);
  `}
  
  ${props => props.$anchorOrigin?.horizontal === 'right' && css`
    left: auto;
    right: ${spacing.lg};
    transform: translateX(0);
  `}
`

const SnackbarContent = styled.div`
  background-color: ${colors.surface.primary};
  border-radius: ${borderRadius.medium};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  max-width: 500px;
  min-width: 300px;
  
  ${props => props.$isVisible ? css`
    animation: ${slideIn} ${animations.duration.medium} ${animations.easing.easeOut} forwards;
  ` : css`
    animation: ${slideOut} ${animations.duration.medium} ${animations.easing.easeIn} forwards;
  `}
`

const Snackbar = ({
  open = false,
  autoHideDuration = 6000,
  onClose,
  children,
  anchorOrigin = { vertical: 'top', horizontal: 'center' },
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (open) {
      setShouldRender(true)
      // Small delay to trigger animation
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (open && autoHideDuration && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, autoHideDuration)
      
      return () => clearTimeout(timer)
    }
  }, [open, autoHideDuration, onClose])

  if (!shouldRender) {
    return null
  }

  return (
    <SnackbarContainer
      $anchorOrigin={anchorOrigin}
      {...props}
    >
      <SnackbarContent $isVisible={isVisible}>
        {children}
      </SnackbarContent>
    </SnackbarContainer>
  )
}

export default Snackbar