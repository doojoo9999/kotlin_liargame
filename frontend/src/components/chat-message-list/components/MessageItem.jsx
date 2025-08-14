import React from 'react'
import PropTypes from 'prop-types'
import CompactChatMessage from '../../CompactChatMessage'

/**
 * Optimized message item component for react-window virtualization
 * Uses React.memo for performance optimization to prevent unnecessary re-renders
 */
const MessageItem = React.memo(({ index, style, data }) => {
  const { messages, currentUserId, isDarkMode } = data
  const message = messages[index]
  
  if (!message) {
    return <div style={style} />
  }
  
  return (
    <div style={style}>
      <CompactChatMessage 
        message={message}
        currentUserId={currentUserId}
        isDarkMode={isDarkMode}
      />
    </div>
  )
})

MessageItem.displayName = 'MessageItem'

MessageItem.propTypes = {
  index: PropTypes.number.isRequired,
  style: PropTypes.object.isRequired,
  data: PropTypes.shape({
    messages: PropTypes.array.isRequired,
    currentUserId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isDarkMode: PropTypes.bool.isRequired
  }).isRequired
}

export default MessageItem