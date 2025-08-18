import React, {memo} from 'react'
import {animations, borderRadius, colors} from '@/styles'

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

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return colors.success.main
      case 'offline':
        return colors.grey[400]
      case 'speaking':
        return colors.primary.main
      case 'away':
        return colors.warning.main
      default:
        return colors.grey[400]
    }
  }

  const statusStyle = {
    position: 'absolute',
    borderRadius: borderRadius.full,
    border: '2px solid white',
    transition: animations.transition.default,
    zIndex: 1,
    width: size,
    height: size,
    bottom: offset,
    right: offset,
    backgroundColor: getStatusColor(),
    ...(status === 'speaking' && {
      animation: 'pulse 1s infinite'
    })
  }

  return (
    <div
      className={className}
      style={statusStyle}
      aria-label={finalAriaLabel}
      role="img"
      {...props}
    />
  )
})

AvatarStatusDot.displayName = 'AvatarStatusDot'

export default AvatarStatusDot