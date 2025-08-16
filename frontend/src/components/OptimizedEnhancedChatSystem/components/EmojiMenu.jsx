import React from 'react'
import {Box, Button, Typography} from '@components/ui'
import styled from 'styled-components'

// Common emojis for the game
const GAME_EMOJIS = [
    '😀', '😂', '🤔', '😮', '😱', '🤨', '😏', '🙄',
    '👍', '👎', '👏', '🤝', '✋', '👋', '🤷', '🤦',
    '❤️', '💯', '🔥', '⭐', '❓', '❗', '💭', '💡',
    '🎭', '🕵️', '👥', '🎯', '🎲', '🏆', '⚡', '💀'
]

// Styled components for emoji menu
const MenuContainer = styled.div`
    position: absolute;
    top: ${props => props.$anchorTop || 0}px;
    left: ${props => props.$anchorLeft || 0}px;
    max-height: 200px;
    width: ${props => props.$isMobile ? '280px' : '320px'};
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 1300;
    transition: all 0.3s ease;
    display: ${props => props.$open ? 'block' : 'none'};
`

const EmojiGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
`

const EmojiButton = styled(Button)`
    font-size: 1.2rem;
    min-width: 32px;
    height: 32px;
    padding: 4px;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: rgba(0, 0, 0, 0.04);
        transform: scale(1.2);
    }
`

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
        <MenuContainer 
            $open={open}
            $anchorTop={anchorPosition.top}
            $anchorLeft={anchorPosition.left}
            $isMobile={isMobile}
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
                <EmojiGrid>
                    {GAME_EMOJIS.map((emoji, index) => (
                        <EmojiButton
                            key={index}
                            onClick={() => handleEmojiClick(emoji)}
                        >
                            {emoji}
                        </EmojiButton>
                    ))}
                </EmojiGrid>
            </Box>
        </MenuContainer>
    )
})

EmojiMenu.displayName = 'EmojiMenu'

export default EmojiMenu