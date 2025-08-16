import {useState} from 'react'
import {Box, Button, Input as TextField} from '@components/ui'
import {Send as SendIcon} from 'lucide-react'
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
    <Box style={{ 
      display: 'flex', 
      alignItems: 'center',
      padding: '8px',
      borderTop: '1px solid #e0e0e0'
    }}>
      <TextField
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        style={{ marginRight: '8px', flex: 1 }}
      />
      <Button 
        onClick={handleSendMessage}
        disabled={!message.trim()}
        aria-label="send message"
        style={{
          minWidth: '40px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <SendIcon size={20} />
      </Button>
    </Box>
  )
}

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired
}

export default ChatInput