import React, {forwardRef, memo, useEffect, useState} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {animations, borderRadius, colors, spacing} from '@/styles'

// Animation keyframes
const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
`

const slideDownAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`

const glowAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 ${colors.primary.main}40;
  }
  50% {
    box-shadow: 0 0 0 4px ${colors.primary.main}20, 0 0 8px ${colors.primary.main}40;
  }
`

// Styled components
const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  width: 100%;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  
  /* Error shake animation */
  ${props => props.$hasError && props.$shake && css`
    animation: ${shakeAnimation} 0.5s ease-in-out;
  `}
`

const StyledInput = styled.input`
  width: 100%;
  padding: ${spacing.md} ${spacing.md};
  font-size: ${props => props.$size === 'small' ? '14px' : props.$size === 'large' ? '18px' : '16px'};
  font-family: inherit;
  color: ${colors.text.primary};
  background-color: ${colors.surface.primary};
  border: 2px solid ${colors.border.primary};
  border-radius: ${borderRadius.medium};
  transition: ${animations.transition.default};
  outline: none;
  
  /* Size variants */
  ${props => props.$size === 'small' && css`
    padding: ${spacing.sm} ${spacing.md};
    font-size: 14px;
    min-height: 32px;
  `}
  
  ${props => props.$size === 'large' && css`
    padding: ${spacing.lg} ${spacing.md};
    font-size: 18px;
    min-height: 56px;
  `}
  
  /* Floating label padding adjustment */
  ${props => props.$hasFloatingLabel && css`
    padding-top: ${props.$size === 'large' ? '22px' : props.$size === 'small' ? '18px' : '20px'};
    padding-bottom: ${props.$size === 'large' ? '18px' : props.$size === 'small' ? '10px' : '14px'};
  `}
  
  /* Focus state with glow effect */
  &:focus {
    border-color: ${colors.primary.main};
    background-color: ${colors.surface.secondary};
    animation: ${glowAnimation} 2s infinite;
  }
  
  /* Error state */
  ${props => props.$hasError && css`
    border-color: ${colors.error.main};
    background-color: ${colors.error.light}08;
    
    &:focus {
      border-color: ${colors.error.main};
      box-shadow: 0 0 0 4px ${colors.error.main}20, 0 0 8px ${colors.error.main}40;
    }
  `}
  
  /* Success state */
  ${props => props.$hasSuccess && css`
    border-color: ${colors.success.main};
    background-color: ${colors.success.light}08;
    
    &:focus {
      border-color: ${colors.success.main};
      box-shadow: 0 0 0 4px ${colors.success.main}20, 0 0 8px ${colors.success.main}40;
    }
  `}
  
  /* Disabled state */
  &:disabled {
    background-color: ${colors.surface.disabled};
    border-color: ${colors.border.disabled};
    color: ${colors.text.disabled};
    cursor: not-allowed;
  }
  
  /* Placeholder styles */
  &::placeholder {
    color: ${colors.text.placeholder};
    transition: ${animations.transition.fast};
  }
  
  &:focus::placeholder {
    opacity: 0.7;
    transform: translateX(4px);
  }
`

const FloatingLabel = styled.label`
  position: absolute;
  left: ${spacing.md};
  top: ${props => {
    // 입력 필드의 기본 높이 기준으로 중앙 계산
    if (props.$size === 'large') return '28px';
    if (props.$size === 'small') return '16px';
    return '22px'; // medium size - 기본 padding 16px + border 2px + 여백 고려
  }};
  transform: none;
  font-size: 16px;
  color: ${colors.text.secondary};
  pointer-events: none;
  transition: ${animations.transition.default};
  background-color: ${colors.surface.primary};
  padding: 0 ${spacing.xs};
  white-space: nowrap;
  max-width: calc(100% - 32px);
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* Active/focused state */
  ${props => (props.$isActive || props.$hasValue) && css`
    top: 0;
    transform: translateY(-50%);
    font-size: 12px;
    color: ${props.$hasError ? colors.error.main : props.$hasSuccess ? colors.success.main : colors.primary.main};
    background-color: ${colors.surface.primary};
  `}
  
  /* Error state */
  ${props => props.$hasError && css`
    color: ${colors.error.main};
  `}
  
  /* Success state */
  ${props => props.$hasSuccess && css`
    color: ${colors.success.main};
  `}
  
  /* Size adjustments */
  ${props => props.$size === 'small' && css`
    font-size: 14px;
    
    ${(props.$isActive || props.$hasValue) && css`
      font-size: 11px;
    `}
  `}
  
  ${props => props.$size === 'large' && css`
    font-size: 18px;
    
    ${(props.$isActive || props.$hasValue) && css`
      font-size: 14px;
    `}
  `}
`

const StatusIcon = styled.div`
  position: absolute;
  right: ${spacing.md};
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  pointer-events: none;
  
  &.success {
    color: ${colors.success.main};
    
    &::before {
      content: '✓';
    }
  }
  
  &.error {
    color: ${colors.error.main};
    
    &::before {
      content: '!';
    }
  }
`

const MessageContainer = styled.div`
  min-height: 20px;
  display: flex;
  align-items: flex-start;
  gap: ${spacing.xs};
`

const Message = styled.div`
  font-size: 12px;
  line-height: 1.4;
  animation: ${slideDownAnimation} 0.3s ease-out;
  
  &.error {
    color: ${colors.error.main};
  }
  
  &.success {
    color: ${colors.success.main};
  }
  
  &.helper {
    color: ${colors.text.secondary};
  }
`

const Input = memo(forwardRef(({
  label = '',
  placeholder = '',
  error = '',
  success = '',
  helperText = '',
  type = 'text',
  size = 'medium',
  disabled = false,
  required = false,
  floatingLabel = true,
  showStatusIcon = true,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(!!value || !!defaultValue)
  const [shouldShake, setShouldShake] = useState(false)

  const hasError = !!error
  const hasSuccess = !!success && !hasError
  const message = error || success || helperText
  const messageType = error ? 'error' : success ? 'success' : 'helper'

  // Handle value changes
  useEffect(() => {
    setHasValue(!!value)
  }, [value])

  // Trigger shake animation on error change
  useEffect(() => {
    if (hasError) {
      setShouldShake(true)
      const timer = setTimeout(() => setShouldShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [error, hasError])

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    setHasValue(!!e.target.value)
    onBlur?.(e)
  }

  const handleChange = (e) => {
    setHasValue(!!e.target.value)
    onChange?.(e)
  }

  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`
  const messageId = `${inputId}-message`

  return (
    <InputContainer className={className}>
      <InputWrapper $hasError={hasError} $shake={shouldShake}>
        <StyledInput
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={floatingLabel ? '' : placeholder}
          disabled={disabled}
          required={required}
          $size={size}
          $hasError={hasError}
          $hasSuccess={hasSuccess}
          $hasFloatingLabel={floatingLabel && !!label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          aria-label={ariaLabel || label}
          aria-describedby={message ? messageId : ariaDescribedBy}
          aria-invalid={hasError}
          aria-required={required}
          {...props}
        />
        
        {floatingLabel && label && (
          <FloatingLabel
            htmlFor={inputId}
            $isActive={isFocused}
            $hasValue={hasValue}
            $hasError={hasError}
            $hasSuccess={hasSuccess}
            $size={size}
          >
            {label}
            {required && ' *'}
          </FloatingLabel>
        )}
        
        {showStatusIcon && (hasError || hasSuccess) && (
          <StatusIcon 
            className={hasError ? 'error' : 'success'}
            aria-label={hasError ? '오류' : '성공'}
          />
        )}
      </InputWrapper>
      
      <MessageContainer>
        {message && (
          <Message 
            id={messageId}
            className={messageType}
            role={messageType === 'error' ? 'alert' : 'status'}
            aria-live={messageType === 'error' ? 'assertive' : 'polite'}
          >
            {message}
          </Message>
        )}
      </MessageContainer>
    </InputContainer>
  )
}))

Input.displayName = 'Input'

export { Input }
export default Input