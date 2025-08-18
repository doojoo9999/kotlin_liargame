import React, {memo, useMemo} from 'react'
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

  const sizeConfig = AVATAR_SIZES[size] || AVATAR_SIZES.medium

  const getAvatarStyle = () => {
    const baseStyle = {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      cursor: onClick ? 'pointer' : 'default',
      transition: animations.transition.default,
      userSelect: 'none',
      width: sizeConfig.size,
      height: sizeConfig.size,
      fontSize: sizeConfig.fontSize
    }

    // Role-based borders
    if (role === 'leader') {
      baseStyle.border = `3px solid ${colors.warning.main}`
      baseStyle.boxShadow = `${shadows.medium}, 0 0 0 1px ${colors.warning.light}`
    } else if (role === 'liar') {
      baseStyle.border = `3px solid ${colors.error.main}`
      baseStyle.boxShadow = `${shadows.medium}, 0 0 0 1px ${colors.error.light}`
    } else if (role === 'citizen') {
      baseStyle.border = `2px solid ${colors.grey[300]}`
    }

    // Speaking state animation
    if (isSpeaking) {
      baseStyle.animation = 'pulse 2s infinite'
      baseStyle.borderColor = colors.primary.main
    }

    // Turn glow effect
    if (isCurrentTurn) {
      baseStyle.animation = 'glow 2s infinite'
    }

    return baseStyle
  }

  const getContentStyle = () => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'inherit',
    background: gradient,
    color: 'white',
    fontWeight: 600,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
  })

  const getStatusDotStyle = () => ({
    position: 'absolute',
    borderRadius: borderRadius.full,
    border: '2px solid white',
    transition: animations.transition.default,
    width: sizeConfig.statusDot,
    height: sizeConfig.statusDot,
    bottom: sizeConfig.statusOffset,
    right: sizeConfig.statusOffset,
    backgroundColor: isSpeaking ? colors.primary.main : 
                   status === 'online' ? colors.success.main : 
                   status === 'offline' ? colors.grey[400] : colors.grey[400]
  })

  const getCompletionBadgeStyle = () => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    height: '60%',
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '70%',
    fontWeight: 'bold',
    animation: 'bounceIn 0.6s ease-out',
    boxShadow: shadows.medium
  })

  const getRoleBadgeStyle = () => ({
    position: 'absolute',
    top: '-2px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: colors.warning.main,
    color: 'white',
    fontSize: '60%',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: borderRadius.small,
    boxShadow: shadows.small,
    zIndex: 2
  })

  return (
    <div
      className={className}
      style={getAvatarStyle()}
      onClick={onClick}
      aria-label={finalAriaLabel}
      {...props}
    >
      <div style={getContentStyle()}>
        {initials}
      </div>
      
      {/* Status indicator */}
      <div style={getStatusDotStyle()} />
      
      {/* Role badge for leaders */}
      {role === 'leader' && (
        <div style={getRoleBadgeStyle()}>
          👑 방장
        </div>
      )}
      
      {/* Vote completion indicator */}
      {isVoteComplete && (
        <div style={getCompletionBadgeStyle()}>
          ✓
        </div>
      )}
    </div>
  )
})

PlayerAvatar.displayName = 'PlayerAvatar'

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

export default PlayerAvatar