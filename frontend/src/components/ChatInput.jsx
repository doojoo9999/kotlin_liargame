import {useState} from 'react'
import {Box, IconButton, TextField} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PropTypes from 'prop-types'

/**
 * ChatInput component provides a text field and send button for users to input messages.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSendMessage - Callback function that is called when a message is sent
 */
function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('')

  const handleInputChange = (event) => {
    setMessage(event.target.value)
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage('') // Clear input after sending
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      p: 1,
      borderTop: 1,
      borderColor: 'divider'
    }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        size="small"
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        sx={{ mr: 1 }}
      />
      <IconButton 
        color="primary" 
        onClick={handleSendMessage}
        disabled={!message.trim()}
        aria-label="send message"
      >
        <SendIcon />
      </IconButton>
    </Box>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired
}

export default ChatInput