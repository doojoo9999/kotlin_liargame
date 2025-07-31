import {ListItem, ListItemText, Typography} from '@mui/material'
import PropTypes from 'prop-types'

/**
 * ChatMessage component displays a single chat message.
 * It can display both user messages and system messages with different styling.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message data object containing id, sender, content, and isSystem flag
 */
function ChatMessage({ message }) {
  // System messages have special styling (centered, different color)
  if (message.isSystem) {
    return (
      <ListItem sx={{ py: 0.5 }}>
        <ListItemText 
          disableTypography
          primary={
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 'medium',
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              {message.content}
            </Typography>
          }
        />
      </ListItem>
    )
  }

  // Regular user messages
  return (
    <ListItem sx={{ py: 0.5 }}>
      <ListItemText 
        disableTypography
        primary={
          <Typography variant="body1">
            <Typography 
              component="span" 
              sx={{ 
                fontWeight: 'bold',
                color: 'secondary.main',
                mr: 1
              }}
            >
              {message.sender}:
            </Typography>
            {message.content}
          </Typography>
        }
      />
    </ListItem>
  )
}

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.number.isRequired,
    sender: PropTypes.string,
    content: PropTypes.string.isRequired,
    isSystem: PropTypes.bool
  }).isRequired
}

export default ChatMessage