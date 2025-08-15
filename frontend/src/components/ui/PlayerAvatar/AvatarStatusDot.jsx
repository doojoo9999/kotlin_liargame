import React, {memo} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {animations, borderRadius, colors} from '@/styles'

// Pulse animation for speaking state
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 ${colors.primary.main}40;
  }
  70% {
    box-shadow: 0 0 0 6px ${colors.primary.main}00;
  }
  100% {
    box-shadow: 0 0 0 0 ${colors.primary.main}00;
  }
`

const StatusDotContainer = styled.div`
  position: absolute;
  border-radius: ${borderRadius.full};
  border: 2px solid white;
  transition: ${animations.transition.default};
  z-index: 1;

  ${props => css`
    width: ${props.size};
    height: ${props.size};
    bottom: ${props.offset};
    right: ${props.offset};
  `}

  ${props => props.status === 'online' && css`
    background-color: ${colors.success.main};
  `}

  ${props => props.status === 'offline' && css`
    background-color: ${colors.grey[400]};
  `}

  ${props => props.status === 'speaking' && css`
    background-color: ${colors.primary.main};
    animation: ${pulseAnimation} 1s infinite;
  `}

  ${props => props.status === 'away' && css`
    background-color: ${colors.warning.main};
  `}
`

const AvatarStatusDot = memo(({
  status = 'online',
  size = '10px',
  offset = '3px',
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const statusLabels = {
    online: '온라인',
    offline: '오프라인',
    speaking: '발언 중',
    away: '자리비움'
  }

  const finalAriaLabel = ariaLabel || `상태: ${statusLabels[status] || status}`

  return (
    <StatusDotContainer
      status={status}
      size={size}
      offset={offset}
      className={className}
      aria-label={finalAriaLabel}
      role="img"
      {...props}
    />
  )
})

AvatarStatusDot.displayName = 'AvatarStatusDot'

export default AvatarStatusDot