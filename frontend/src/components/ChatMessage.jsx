import React from 'react'
import {ListItem, ListItemText, Typography} from './ui'
import PropTypes from 'prop-types'

function ChatMessage({ message }) {
    console.log('[DEBUG] ChatMessage received:', message)

    if (message.isSystem) {
        return (
            <ListItem style={{ paddingTop: '4px', paddingBottom: '4px' }}>
                <ListItemText
                    disableTypography
                    primary={
                        <Typography
                            variant="body1"
                            style={{
                                color: '#667eea',
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

    const senderName = message.playerNickname || message.sender || '익명'

    return (
        <ListItem style={{ paddingTop: '4px', paddingBottom: '4px' }}>
            <ListItemText
                disableTypography
                primary={
                    <Typography variant="body1">
                        <Typography
                            component="span"
                            style={{
                                fontWeight: 'bold',
                                color: '#764ba2',
                                marginRight: '8px'
                            }}
                        >
                            {senderName}:
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
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        playerNickname: PropTypes.string,
        playerId: PropTypes.number,
        sender: PropTypes.string,
        content: PropTypes.string.isRequired,
        isSystem: PropTypes.bool,
        timestamp: PropTypes.string,
        type: PropTypes.string
    }).isRequired
}

// Memoized component to prevent unnecessary re-renders
const MemoizedChatMessage = React.memo(ChatMessage)

export default MemoizedChatMessage
