import React from 'react'
import {Box, Button, Typography} from '@components/ui'

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
    const [anchorPosition, setAnchorPosition] = React.useState({ top: 0, left: 0 })

    // Calculate position from anchorEl
    React.useEffect(() => {
        if (anchorEl && open) {
            const rect = anchorEl.getBoundingClientRect()
            setAnchorPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            })
        }
    }, [anchorEl, open])

    // Handle click outside to close menu
    React.useEffect(() => {
        if (!open) return

        const handleClickOutside = (event) => {
            if (anchorEl && !anchorEl.contains(event.target)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open, anchorEl, onClose])

    const handleEmojiClick = React.useCallback((emoji) => {
        onEmojiSelect(emoji)
        onClose()
    }, [onEmojiSelect, onClose])

    if (!open) return null

    return (
        <div 
            style={{
                position: 'absolute',
                top: `${anchorPosition.top}px`,
                left: `${anchorPosition.left}px`,
                maxHeight: '200px',
                width: isMobile ? '280px' : '320px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 1300,
                transition: 'all 0.3s ease',
                display: open ? 'block' : 'none'
            }}
        >
            <Box style={{ padding: '8px' }}>
                <Typography
                    variant="caption"
                    style={{ 
                        marginBottom: '8px',
                        display: 'block',
                        color: '#666666'
                    }}
                >
                    자주 사용하는 이모지
                </Typography>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '4px'
                }}>
                    {GAME_EMOJIS.map((emoji, index) => (
                        <Button
                            key={index}
                            onClick={() => handleEmojiClick(emoji)}
                            style={{
                                fontSize: '1.2rem',
                                minWidth: '32px',
                                height: '32px',
                                padding: '4px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {emoji}
                        </Button>
                    ))}
                </div>
            </Box>
        </div>
    )
})

EmojiMenu.displayName = 'EmojiMenu'

export default EmojiMenu