import React, {memo} from 'react'
import styled, {css} from 'styled-components'
import {borderRadius, colors, shadows, spacing} from '@/styles'

const BadgeContainer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 2;
  white-space: nowrap;
  pointer-events: none;

  ${props => props.position === 'top' && css`
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
  `}

  ${props => props.position === 'bottom' && css`
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
  `}

  ${props => props.position === 'top-right' && css`
    top: -2px;
    right: -2px;
  `}

  ${props => props.position === 'top-left' && css`
    top: -2px;
    left: -2px;
  `}
`

const LeaderBadge = styled.div`
  background-color: ${colors.warning.main};
  color: white;
  font-size: ${props => props.fontSize || '10px'};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.small};
  box-shadow: ${shadows.small};
  display: flex;
  align-items: center;
  gap: 2px;

  &::before {
    content: '👑';
    font-size: 0.9em;
  }
`

const LiarBadge = styled.div`
  background-color: ${colors.error.main};
  color: white;
  font-size: ${props => props.fontSize || '10px'};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.small};
  box-shadow: ${shadows.small};
  display: flex;
  align-items: center;
  gap: 2px;

  &::before {
    content: '🎭';
    font-size: 0.9em;
  }
`

const CustomBadge = styled.div`
  background-color: ${props => props.bgColor || colors.grey[600]};
  color: ${props => props.textColor || 'white'};
  font-size: ${props => props.fontSize || '10px'};
  padding: ${spacing.xs} ${spacing.sm};
  border-radius: ${borderRadius.small};
  box-shadow: ${shadows.small};
  display: flex;
  align-items: center;
  gap: 2px;

  ${props => props.icon && css`
    &::before {
      content: '${props.icon}';
      font-size: 0.9em;
    }
  `}
`

const AvatarBadge = memo(({
  type = 'custom', // 'leader' | 'liar' | 'custom'
  text = '',
  icon = '',
  position = 'top',
  fontSize = '10px',
  bgColor,
  textColor,
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const getBadgeComponent = () => {
    switch (type) {
      case 'leader':
        return (
          <LeaderBadge fontSize={fontSize}>
            {text || '방장'}
          </LeaderBadge>
        )
      case 'liar':
        return (
          <LiarBadge fontSize={fontSize}>
            {text || '라이어'}
          </LiarBadge>
        )
      case 'custom':
      default:
        return (
          <CustomBadge
            fontSize={fontSize}
            bgColor={bgColor}
            textColor={textColor}
            icon={icon}
          >
            {text}
          </CustomBadge>
        )
    }
  }

  const typeLabels = {
    leader: '방장',
    liar: '라이어',
    custom: text
  }

  const finalAriaLabel = ariaLabel || `역할: ${typeLabels[type] || text}`

  return (
    <BadgeContainer
      position={position}
      className={className}
      aria-label={finalAriaLabel}
      role="img"
      {...props}
    >
      {getBadgeComponent()}
    </BadgeContainer>
  )
})

AvatarBadge.displayName = 'AvatarBadge'

export default AvatarBadge