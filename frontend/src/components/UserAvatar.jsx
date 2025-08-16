import React from 'react'
import {PlayerAvatar} from '@components/ui'
import PropTypes from 'prop-types'

/**
 * Reusable UserAvatar component with consistent styling and behavior
 * Provides standardized avatar display with optional online status indicator
 */
function UserAvatar({
  userId,
  nickname,
  avatarUrl,
  size = 'medium',
  showOnlineStatus = false,
  isCurrentTurn = false,
  additionalSx = {},
  ...otherProps
}) {
  const avatarElement = (
    <PlayerAvatar
      nickname={nickname}
      size={size}
      isCurrentTurn={isCurrentTurn}
      status={showOnlineStatus ? 'online' : 'offline'}
      style={{
        ...additionalSx,
        // Add current turn styling if needed
        ...(isCurrentTurn && {
          border: '2px solid #ff9800',
          boxShadow: '0 0 8px rgba(255, 152, 0, 0.4)'
        })
      }}
      {...otherProps}
    />
  )

  return avatarElement
}

UserAvatar.propTypes = {
  /** User ID for color generation fallback */
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** User nickname for display and color generation */
  nickname: PropTypes.string,
  /** Optional avatar image URL */
  avatarUrl: PropTypes.string,
  /** Size variant: 'small' (24px), 'medium' (40px), 'large' (56px) */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Whether to show green online status indicator */
  showOnlineStatus: PropTypes.bool,
  /** Whether this user is currently taking their turn */
  isCurrentTurn: PropTypes.bool,
  /** Additional sx styling to apply */
  additionalSx: PropTypes.object
}

export default UserAvatar