// Message types compatibility with the original system
export const MESSAGE_TYPES = {
    USER: 'user',
    SYSTEM: 'system',
    INFO: 'info',
    WARNING: 'warning',
    SUCCESS: 'success',
    GAME_EVENT: 'game_event'
}

/**
 * Convert original message format to our optimized format
 * @param {Object} message - Original message object
 * @param {number} index - Message index for unique ID generation
 * @returns {Object} Converted message in optimized format
 */
export const convertMessageFormat = (message, index) => {
    // Determine if it's a system message
    const isSystem = message.type && [
        MESSAGE_TYPES.SYSTEM,
        MESSAGE_TYPES.INFO,
        MESSAGE_TYPES.WARNING,
        MESSAGE_TYPES.SUCCESS,
        MESSAGE_TYPES.GAME_EVENT
    ].includes(message.type)

    return {
        id: message.id || `msg-${index}-${Date.now()}`,
        content: message.content || '',
        playerNickname: message.playerNickname || message.sender,
        playerId: message.playerId || message.userId,
        sender: message.sender || message.playerNickname,
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        isSystem: isSystem,
        type: message.type || 'user',
        // Additional metadata for enhanced features
        originalMessage: message
    }
}

export default convertMessageFormat