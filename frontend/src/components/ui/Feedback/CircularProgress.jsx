import React, {memo} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {colors} from '@/styles'

// Spin animation for circular progress
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

// Dash animation for indeterminate progress
const dash = keyframes`
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 100, 200;
    stroke-dashoffset: -15;
  }
  100% {
    stroke-dasharray: 100, 200;
    stroke-dashoffset: -125;
  }
`

// Container for the progress indicator
const ProgressContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  ${props => css`
    width: ${props.$size}px;
    height: ${props.$size}px;
  `}
`

// SVG element
const ProgressSvg = styled.svg`
  animation: ${spin} 1.4s linear infinite;
  
  ${props => css`
    width: ${props.$size}px;
    height: ${props.$size}px;
  `}
`

// Circle element
const ProgressCircle = styled.circle`
  stroke: ${props => props.$color};
  fill: none;
  stroke-width: ${props => props.$thickness};
  stroke-linecap: round;
  
  ${props => props.$variant === 'indeterminate' && css`
    animation: ${dash} 1.4s ease-in-out infinite;
    stroke-dasharray: 80, 200;
    stroke-dashoffset: 0;
  `}
  
  ${props => props.$variant === 'determinate' && css`
    transition: stroke-dashoffset 0.3s ease;
    stroke-dasharray: ${props.$circumference};
    stroke-dashoffset: ${props.$circumference - (props.$value / 100) * props.$circumference};
    transform-origin: center;
    transform: rotate(-90deg);
  `}
`

// Background circle for determinate variant
const BackgroundCircle = styled.circle`
  stroke: ${props => props.$backgroundColor};
  fill: none;
  stroke-width: ${props => props.$thickness};
  opacity: 0.2;
`

// Value text for determinate variant
const ProgressText = styled.text`
  fill: ${props => props.$color};
  font-size: ${props => props.$size * 0.25}px;
  font-weight: 500;
  text-anchor: middle;
  dominant-baseline: middle;
`

const CircularProgress = memo(({
  size = 40,
  thickness = 3.6,
  value = 0,
  variant = 'indeterminate', // 'indeterminate' | 'determinate'
  color = colors.primary.main,
  backgroundColor = colors.grey[300],
  showValue = false,
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  // Calculate circle properties
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  
  // Normalize value between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value))
  
  const finalAriaLabel = ariaLabel || 
    (variant === 'determinate' 
      ? `진행률 ${Math.round(normalizedValue)}%`
      : '로딩 중')

  return (
    <ProgressContainer
      className={className}
      $size={size}
      role="progressbar"
      aria-label={finalAriaLabel}
      aria-valuenow={variant === 'determinate' ? normalizedValue : undefined}
      aria-valuemin={variant === 'determinate' ? 0 : undefined}
      aria-valuemax={variant === 'determinate' ? 100 : undefined}
      {...props}
    >
      <ProgressSvg
        $size={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle for determinate variant */}
        {variant === 'determinate' && (
          <BackgroundCircle
            cx={center}
            cy={center}
            r={radius}
            $thickness={thickness}
            $backgroundColor={backgroundColor}
          />
        )}
        
        {/* Progress circle */}
        <ProgressCircle
          cx={center}
          cy={center}
          r={radius}
          $variant={variant}
          $color={color}
          $thickness={thickness}
          $circumference={circumference}
          $value={normalizedValue}
        />
        
        {/* Value text for determinate variant */}
        {variant === 'determinate' && showValue && (
          <ProgressText
            x={center}
            y={center}
            $size={size}
            $color={color}
          >
            {Math.round(normalizedValue)}%
          </ProgressText>
        )}
      </ProgressSvg>
    </ProgressContainer>
  )
})

CircularProgress.displayName = 'CircularProgress'

export default CircularProgress