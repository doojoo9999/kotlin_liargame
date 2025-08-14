import React from 'react'
import {Avatar, Badge} from '@mui/material'
import PropTypes from 'prop-types'
import {generateAvatarProps} from '../utils/avatarUtils'

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
  // Generate base avatar props using centralized utility
  const avatarProps = generateAvatarProps({
    nickname,
    userId,
    avatarUrl,
    size,
    additionalSx: {
      ...additionalSx,
      // Add current turn styling if needed
      ...(isCurrentTurn && {
        border: '2px solid #ff9800',
        boxShadow: '0 0 8px rgba(255, 152, 0, 0.4)'
      })
    }
  })

  // Merge with any additional props passed down
  const finalAvatarProps = {
    ...avatarProps,
    ...otherProps
  }

  const avatarElement = <Avatar {...finalAvatarProps} />

  // Wrap with Badge for online status if requested
  if (showOnlineStatus) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <div
            style={{
              width: size === 'small' ? 8 : size === 'large' ? 12 : 10,
              height: size === 'small' ? 8 : size === 'large' ? 12 : 10,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              border: '2px solid white'
            }}
          />
        }
      >
        {avatarElement}
      </Badge>
    )
  }

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