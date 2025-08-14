import React from 'react'
import { Box, Typography } from '@mui/material'

/**
 * ChatHeader component for displaying performance indicators
 * @param {boolean} shouldShowPanel - Whether to show the performance panel
 * @param {Object} panelData - Performance data to display
 */
const ChatHeader = React.memo(({ shouldShowPanel, panelData }) => {
    if (!shouldShowPanel) {
        return null
    }

    return (
        <Box sx={{
            p: 0.5,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            textAlign: 'center'
        }}>
            <Typography variant="caption">
                메시지 처리 중... ({panelData.messagesProcessed} 처리됨)
            </Typography>
        </Box>
    )
})

ChatHeader.displayName = 'ChatHeader'

export default ChatHeader