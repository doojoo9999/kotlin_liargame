import React, {memo} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {borderRadius, colors, shadows, spacing} from '@/styles'

// Animation for alert appearance
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

// Base alert styles
const AlertContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.sm};
  padding: ${spacing.md};
  border-radius: ${borderRadius.medium};
  font-size: 14px;
  line-height: 1.4;
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid;
  box-shadow: ${shadows.small};
  
  /* Severity styles */
  ${props => props.$severity === 'error' && css`
    background-color: ${colors.error.light}20;
    border-color: ${colors.error.light};
    color: ${colors.error.dark};
  `}
  
  ${props => props.$severity === 'warning' && css`
    background-color: ${colors.warning.light}20;
    border-color: ${colors.warning.light};
    color: ${colors.warning.dark};
  `}
  
  ${props => props.$severity === 'info' && css`
    background-color: ${colors.info.light}20;
    border-color: ${colors.info.light};
    color: ${colors.info.dark};
  `}
  
  ${props => props.$severity === 'success' && css`
    background-color: ${colors.success.light}20;
    border-color: ${colors.success.light};
    color: ${colors.success.dark};
  `}
  
  /* Variant styles */
  ${props => props.$variant === 'filled' && props.$severity === 'error' && css`
    background-color: ${colors.error.main};
    border-color: ${colors.error.main};
    color: white;
  `}
  
  ${props => props.$variant === 'filled' && props.$severity === 'warning' && css`
    background-color: ${colors.warning.main};
    border-color: ${colors.warning.main};
    color: white;
  `}
  
  ${props => props.$variant === 'filled' && props.$severity === 'info' && css`
    background-color: ${colors.info.main};
    border-color: ${colors.info.main};
    color: white;
  `}
  
  ${props => props.$variant === 'filled' && props.$severity === 'success' && css`
    background-color: ${colors.success.main};
    border-color: ${colors.success.main};
    color: white;
  `}
  
  ${props => props.$variant === 'outlined' && css`
    background-color: transparent;
  `}
`

const AlertIcon = styled.div`
  flex-shrink: 0;
  font-size: 18px;
  font-weight: bold;
  margin-top: 1px;
  
  ${props => props.$severity === 'error' && css`
    color: ${props.$variant === 'filled' ? 'white' : colors.error.main};
    
    &::before {
      content: '⚠';
    }
  `}
  
  ${props => props.$severity === 'warning' && css`
    color: ${props.$variant === 'filled' ? 'white' : colors.warning.main};
    
    &::before {
      content: '⚠';
    }
  `}
  
  ${props => props.$severity === 'info' && css`
    color: ${props.$variant === 'filled' ? 'white' : colors.info.main};
    
    &::before {
      content: 'ℹ';
    }
  `}
  
  ${props => props.$severity === 'success' && css`
    color: ${props.$variant === 'filled' ? 'white' : colors.success.main};
    
    &::before {
      content: '✓';
    }
  `}
`

const AlertContent = styled.div`
  flex: 1;
  min-width: 0;
`

const AlertTitle = styled.div`
  font-weight: 600;
  margin-bottom: ${spacing.xs};
`

const AlertMessage = styled.div`
  line-height: 1.5;
`

const Alert = memo(({
  children,
  severity = 'info', // 'error' | 'warning' | 'info' | 'success'
  variant = 'standard', // 'standard' | 'filled' | 'outlined'
  title,
  showIcon = true,
  className,
  role = 'alert',
  'aria-live': ariaLive,
  ...props
}) => {
  const finalAriaLive = ariaLive || (severity === 'error' ? 'assertive' : 'polite')
  
  const severityLabels = {
    error: '오류',
    warning: '경고',
    info: '정보',
    success: '성공'
  }

  return (
    <AlertContainer
      className={className}
      $severity={severity}
      $variant={variant}
      role={role}
      aria-live={finalAriaLive}
      aria-label={`${severityLabels[severity]} 메시지`}
      {...props}
    >
      {showIcon && (
        <AlertIcon 
          $severity={severity}
          $variant={variant}
          aria-hidden="true"
        />
      )}
      
      <AlertContent>
        {title && (
          <AlertTitle>
            {title}
          </AlertTitle>
        )}
        
        <AlertMessage>
          {children}
        </AlertMessage>
      </AlertContent>
    </AlertContainer>
  )
})

Alert.displayName = 'Alert'

export default Alert