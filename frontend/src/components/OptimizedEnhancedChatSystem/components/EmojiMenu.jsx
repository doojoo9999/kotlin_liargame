import React from 'react'
import { Box, IconButton, Menu, Typography } from '@mui/material'
import { THEME_TRANSITIONS } from '../../../styles/themeVariants'

// Common emojis for the game
const GAME_EMOJIS = [
    '😀', '😂', '🤔', '😮', '😱', '🤨', '😏', '🙄',
    '👍', '👎', '👏', '🤝', '✋', '👋', '🤷', '🤦',
    '❤️', '💯', '🔥', '⭐', '❓', '❗', '💭', '💡',
    '🎭', '🕵️', '👥', '🎯', '🎲', '🏆', '⚡', '💀'
]

/**
 * EmojiMenu component for emoji selection
 */
const EmojiMenu = React.memo(({
    anchorEl,
    open,
    onClose,
    onEmojiSelect,
    isMobile
}) => {
    const handleEmojiClick = React.useCallback((emoji) => {
        onEmojiSelect(emoji)
    }, [onEmojiSelect])

    // Stable sx objects to prevent re-renders
    const paperProps = React.useMemo(() => ({
        sx: {
            maxHeight: 200,
            width: isMobile ? 280 : 320,
            backgroundColor: 'background.paper',
            transition: THEME_TRANSITIONS.standard
        }
    }), [isMobile])

    const containerSx = React.useMemo(() => ({
        p: 1
    }), [])

    const titleSx = React.useMemo(() => ({
        mb: 1,
        display: 'block',
        color: 'text.secondary'
    }), [])

    const gridSx = React.useMemo(() => ({
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 0.5
    }), [])

    const emojiButtonSx = React.useMemo(() => ({
        fontSize: '1.2rem',
        transition: THEME_TRANSITIONS.fast,
        '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'scale(1.2)'
        }
    }), [])

    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={paperProps}
        >
            <Box sx={containerSx}>
                <Typography
                    variant="caption"
                    sx={titleSx}
                >
                    자주 사용하는 이모지
                </Typography>
                <Box sx={gridSx}>
                    {GAME_EMOJIS.map((emoji, index) => (
                        <IconButton
                            key={index}
                            size="small"
                            onClick={() => handleEmojiClick(emoji)}
                            sx={emojiButtonSx}
                        >
                            {emoji}
                        </IconButton>
                    ))}
                </Box>
            </Box>
        </Menu>
    )
})

EmojiMenu.displayName = 'EmojiMenu'

export default EmojiMenu