import {ListItem, ListItemText, Typography} from '@mui/material'
import PropTypes from 'prop-types'

function ChatMessage({ message }) {
    console.log('[DEBUG] ChatMessage received:', message)

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

    const senderName = message.playerNickname || message.sender || '익명'

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

export default ChatMessage
