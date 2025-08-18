import React, {memo} from 'react'
import {borderRadius, colors, shadows, spacing} from '@/styles'

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
  const getBadgeStyle = () => {
    const baseStyle = {
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      zIndex: 2,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      fontSize: fontSize,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.small,
      boxShadow: shadows.small,
      gap: '2px'
    }

    // Position styles
    if (position === 'top') {
      baseStyle.top = '-4px'
      baseStyle.left = '50%'
      baseStyle.transform = 'translateX(-50%)'
    } else if (position === 'bottom') {
      baseStyle.bottom = '-4px'
      baseStyle.left = '50%'
      baseStyle.transform = 'translateX(-50%)'
    } else if (position === 'top-right') {
      baseStyle.top = '-2px'
      baseStyle.right = '-2px'
    } else if (position === 'top-left') {
      baseStyle.top = '-2px'
      baseStyle.left = '-2px'
    }

    // Type-specific styles
    if (type === 'leader') {
      baseStyle.backgroundColor = colors.warning.main
      baseStyle.color = 'white'
    } else if (type === 'liar') {
      baseStyle.backgroundColor = colors.error.main
      baseStyle.color = 'white'
    } else {
      baseStyle.backgroundColor = bgColor || colors.grey[600]
      baseStyle.color = textColor || 'white'
    }

    return baseStyle
  }

  const getBadgeContent = () => {
    if (type === 'leader') {
      return (
        <>
          👑
          {text || '방장'}
        </>
      )
    } else if (type === 'liar') {
      return (
        <>
          🎭
          {text || '라이어'}
        </>
      )
    } else {
      return (
        <>
          {icon && <span style={{ fontSize: '0.9em' }}>{icon}</span>}
          {text}
        </>
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
    <div
      className={className}
      style={getBadgeStyle()}
      aria-label={finalAriaLabel}
      role="img"
      {...props}
    >
      {getBadgeContent()}
    </div>
  )
})

AvatarBadge.displayName = 'AvatarBadge'

export default AvatarBadge