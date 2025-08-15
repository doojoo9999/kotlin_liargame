import React, {memo, useMemo} from 'react'
import styled, {css, keyframes} from 'styled-components'
import {animations, borderRadius, colors, shadows} from '@/styles'

// Size presets for avatar variants
const AVATAR_SIZES = {
  large: {
    size: '64px',
    fontSize: '24px',
    statusDot: '12px',
    statusOffset: '4px'
  },
  medium: {
    size: '48px',
    fontSize: '18px',
    statusDot: '10px',
    statusOffset: '3px'
  },
  small: {
    size: '32px',
    fontSize: '12px',
    statusDot: '8px',
    statusOffset: '2px'
  },
  tiny: {
    size: '24px',
    fontSize: '10px',
    statusDot: '6px',
    statusOffset: '1px'
  }
}

// Animation keyframes
const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 ${colors.primary.main}40;
  }
  70% {
    box-shadow: 0 0 0 10px ${colors.primary.main}00;
  }
  100% {
    box-shadow: 0 0 0 0 ${colors.primary.main}00;
  }
`

const bounceInAnimation = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

const glowAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px ${colors.warning.main}40;
  }
  50% {
    box-shadow: 0 0 20px ${colors.warning.main}80, 0 0 30px ${colors.warning.main}60;
  }
`

// Styled components
const AvatarContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${borderRadius.full};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: ${animations.transition.default};
  user-select: none;

  ${props => {
    const size = AVATAR_SIZES[props.size] || AVATAR_SIZES.medium
    return css`
      width: ${size.size};
      height: ${size.size};
      font-size: ${size.fontSize};
    `
  }}

  /* Role-based borders */
  ${props => props.role === 'leader' && css`
    border: 3px solid ${colors.warning.main};
    box-shadow: ${shadows.medium}, 0 0 0 1px ${colors.warning.light};
  `}

  ${props => props.role === 'liar' && css`
    border: 3px solid ${colors.error.main};
    box-shadow: ${shadows.medium}, 0 0 0 1px ${colors.error.light};
  `}

  ${props => props.role === 'citizen' && css`
    border: 2px solid ${colors.grey[300]};
  `}

  /* Speaking state animation */
  ${props => props.isSpeaking && css`
    animation: ${pulseAnimation} 2s infinite;
    border-color: ${colors.primary.main};
  `}

  /* Turn glow effect */
  ${props => props.isCurrentTurn && css`
    animation: ${glowAnimation} 2s infinite;
  `}

  /* Hover effect */
  ${props => props.clickable && css`
    &:hover {
      transform: scale(1.05);
      box-shadow: ${shadows.large};
    }

    &:active {
      transform: scale(0.95);
      transition: ${animations.transition.fast};
    }
  `}
`

const AvatarContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: ${props => props.gradient};
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`

const StatusDot = styled.div`
  position: absolute;
  border-radius: ${borderRadius.full};
  border: 2px solid white;
  transition: ${animations.transition.default};

  ${props => {
    const size = AVATAR_SIZES[props.avatarSize] || AVATAR_SIZES.medium
    return css`
      width: ${size.statusDot};
      height: ${size.statusDot};
      bottom: ${size.statusOffset};
      right: ${size.statusOffset};
    `
  }}

  /* Status colors */
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
`

const CompletionBadge = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  background-color: ${colors.success.main};
  border-radius: ${borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 70%;
  font-weight: bold;
  animation: ${bounceInAnimation} 0.6s ease-out;
  box-shadow: ${shadows.medium};

  &::before {
    content: '✓';
  }
`

const RoleBadge = styled.div`
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  background-color: ${colors.warning.main};
  color: white;
  font-size: 60%;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: ${borderRadius.small};
  box-shadow: ${shadows.small};
  z-index: 2;

  ${props => props.role === 'leader' && css`
    &::before {
      content: '👑';
      margin-right: 2px;
    }
  `}
`

// Utility function to generate gradient from nickname
const generateGradientFromNickname = (nickname) => {
  if (!nickname) return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  
  // Hash function for consistent color generation
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Predefined gradient combinations
  const gradients = [
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
    'linear-gradient(135deg, #a8edea, #fed6e3)',
    'linear-gradient(135deg, #ff9a9e, #fecfef)',
    'linear-gradient(135deg, #a18cd1, #fbc2eb)'
  ]
  
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

// Utility function to get initials
const getInitials = (nickname) => {
  if (!nickname) return '?'
  
  // Handle Korean names (take first character)
  if (/[가-힣]/.test(nickname)) {
    return nickname.charAt(0)
  }
  
  // Handle English names (take first letters of words)
  const words = nickname.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  return words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

const PlayerAvatar = memo(({
  nickname = '',
  size = 'medium',
  status = 'online', // 'online' | 'offline' | 'speaking'
  role = 'citizen', // 'citizen' | 'liar' | 'leader'
  isVoteComplete = false,
  isSpeaking = false,
  isCurrentTurn = false,
  onClick,
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const gradient = useMemo(() => generateGradientFromNickname(nickname), [nickname])
  const initials = useMemo(() => getInitials(nickname), [nickname])
  
  const finalAriaLabel = ariaLabel || `${nickname}의 아바타${role === 'leader' ? ' (방장)' : ''}${status === 'online' ? ' (온라인)' : ' (오프라인)'}`

  return (
    <AvatarContainer
      size={size}
      role={role}
      isSpeaking={isSpeaking}
      isCurrentTurn={isCurrentTurn}
      clickable={!!onClick}
      onClick={onClick}
      className={className}
      aria-label={finalAriaLabel}
      {...props}
    >
      <AvatarContent gradient={gradient}>
        {initials}
      </AvatarContent>
      
      {/* Status indicator */}
      <StatusDot 
        status={isSpeaking ? 'speaking' : status}
        avatarSize={size}
      />
      
      {/* Role badge for leaders */}
      {role === 'leader' && (
        <RoleBadge role={role}>
          방장
        </RoleBadge>
      )}
      
      {/* Vote completion indicator */}
      {isVoteComplete && (
        <CompletionBadge />
      )}
    </AvatarContainer>
  )
})

PlayerAvatar.displayName = 'PlayerAvatar'

export default PlayerAvatar