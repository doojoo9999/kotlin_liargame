import { useState, useCallback } from 'react'

/**
 * Custom hook for managing emoji menu state and interactions
 * @param {function} onEmojiSelect - Callback when emoji is selected
 * @returns {Object} Emoji menu state and handlers
 */
export const useEmojiMenu = (onEmojiSelect) => {
    const [emojiMenuAnchor, setEmojiMenuAnchor] = useState(null)

    const openEmojiMenu = useCallback((event) => {
        setEmojiMenuAnchor(event.currentTarget)
    }, [])

    const closeEmojiMenu = useCallback(() => {
        setEmojiMenuAnchor(null)
    }, [])

    const handleEmojiSelect = useCallback((emoji) => {
        onEmojiSelect?.(emoji)
        closeEmojiMenu()
    }, [onEmojiSelect, closeEmojiMenu])

    return {
        emojiMenuAnchor,
        isEmojiMenuOpen: Boolean(emojiMenuAnchor),
        openEmojiMenu,
        closeEmojiMenu,
        handleEmojiSelect
    }
}

export default useEmojiMenu