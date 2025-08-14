/**
 * Chat-related WebSocket event handlers
 * Handles all chat message events and related functionality
 */

import {normalizeChatMessage} from '../dataTransformers.js';

/**
 * Creates chat event handlers with access to dispatch function
 * @param {Function} dispatch - Redux-style dispatch function for state updates
 * @returns {Object} Object containing chat event handlers
 */
export const createChatEventHandlers = (dispatch) => {
  if (typeof dispatch !== 'function') {
    throw new Error('[chatEventHandlers] dispatch must be a function');
  }

  /**
   * Handles incoming chat messages
   * @param {Object} message - Raw chat message from WebSocket
   */
  const handleChatMessage = (message) => {
    try {
      console.log('[DEBUG_LOG] Received chat message:', message);
      
      const normalizedMessage = normalizeChatMessage(message);
      if (!normalizedMessage) {
        console.warn('[DEBUG_LOG] Failed to normalize chat message:', message);
        return;
      }

      // Dispatch action to add chat message to state
      dispatch({
        type: 'ADD_CHAT_MESSAGE',
        payload: normalizedMessage
      });

      // Log the message for debugging
      console.log('[DEBUG_LOG] Chat message added to state:', {
        sender: normalizedMessage.sender?.nickname,
        content: normalizedMessage.content,
        type: normalizedMessage.type
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling chat message:', error, message);
    }
  };

  /**
   * Handles chat history loading
   * @param {Array} messages - Array of historical chat messages
   */
  const handleChatHistory = (messages) => {
    try {
      console.log('[DEBUG_LOG] Loading chat history:', messages?.length || 0, 'messages');
      
      if (!Array.isArray(messages)) {
        console.warn('[DEBUG_LOG] Chat history is not an array:', messages);
        return;
      }

      const normalizedMessages = messages
        .map(normalizeChatMessage)
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

      // Dispatch action to set chat messages
      dispatch({
        type: 'SET_CHAT_MESSAGES',
        payload: normalizedMessages
      });

      console.log('[DEBUG_LOG] Chat history loaded:', normalizedMessages.length, 'messages');

    } catch (error) {
      console.error('[DEBUG_LOG] Error loading chat history:', error, messages);
    }
  };

  /**
   * Handles clearing chat messages
   */
  const handleClearChat = () => {
    try {
      console.log('[DEBUG_LOG] Clearing chat messages');
      
      dispatch({
        type: 'CLEAR_CHAT_MESSAGES',
        payload: null
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error clearing chat:', error);
    }
  };

  /**
   * Handles chat-related system messages
   * @param {Object} systemMessage - System message about chat events
   */
  const handleChatSystemMessage = (systemMessage) => {
    try {
      console.log('[DEBUG_LOG] Received chat system message:', systemMessage);
      
      // Create a system message format
      const normalizedMessage = normalizeChatMessage({
        ...systemMessage,
        type: 'SYSTEM',
        sender: {
          id: 'system',
          nickname: 'System'
        },
        content: systemMessage.content || systemMessage.message
      });

      if (normalizedMessage) {
        dispatch({
          type: 'ADD_CHAT_MESSAGE',
          payload: normalizedMessage
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling chat system message:', error, systemMessage);
    }
  };

  /**
   * Handles chat connection status updates
   * @param {boolean} connected - Connection status
   */
  const handleChatConnectionStatus = (connected) => {
    try {
      console.log('[DEBUG_LOG] Chat connection status:', connected);
      
      // You can add specific chat connection handling here
      // For now, we'll just log it
      if (!connected) {
        // Add system message about disconnection
        const disconnectMessage = normalizeChatMessage({
          type: 'SYSTEM',
          sender: {
            id: 'system',
            nickname: 'System'
          },
          content: '채팅 연결이 끊어졌습니다. 재연결을 시도하고 있습니다...',
          timestamp: Date.now()
        });

        if (disconnectMessage) {
          dispatch({
            type: 'ADD_CHAT_MESSAGE',
            payload: disconnectMessage
          });
        }
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling chat connection status:', error);
    }
  };

  /**
   * Handles chat message delivery confirmation
   * @param {Object} confirmation - Message delivery confirmation
   */
  const handleMessageDeliveryConfirmation = (confirmation) => {
    try {
      console.log('[DEBUG_LOG] Message delivery confirmation:', confirmation);
      
      // Update message status if needed
      // This could be used for showing message delivery status in UI
      
    } catch (error) {
      console.error('[DEBUG_LOG] Error handling message delivery confirmation:', error);
    }
  };

  /**
   * Handles chat error events
   * @param {Object} error - Chat error information
   */
  const handleChatError = (error) => {
    try {
      console.error('[DEBUG_LOG] Chat error received:', error);
      
      // Add error message to chat
      const errorMessage = normalizeChatMessage({
        type: 'SYSTEM',
        sender: {
          id: 'system',
          nickname: 'System'
        },
        content: `채팅 오류: ${error.message || '알 수 없는 오류가 발생했습니다'}`,
        timestamp: Date.now()
      });

      if (errorMessage) {
        dispatch({
          type: 'ADD_CHAT_MESSAGE',
          payload: errorMessage
        });
      }

    } catch (err) {
      console.error('[DEBUG_LOG] Error handling chat error:', err, error);
    }
  };

  // Return all chat event handlers
  return {
    handleChatMessage,
    handleChatHistory,
    handleClearChat,
    handleChatSystemMessage,
    handleChatConnectionStatus,
    handleMessageDeliveryConfirmation,
    handleChatError
  };
};

/**
 * Utility function to validate chat message before processing
 * @param {Object} message - Message to validate
 * @returns {boolean} True if message is valid
 */
export const validateChatMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  // Must have content
  if (!message.content && !message.message) {
    return false;
  }

  // Must have sender info
  if (!message.sender && !message.player) {
    return false;
  }

  return true;
};

/**
 * Utility function to filter inappropriate chat content
 * @param {string} content - Message content to filter
 * @returns {string} Filtered content
 */
export const filterChatContent = (content) => {
  if (typeof content !== 'string') {
    return '';
  }

  // Basic content filtering - extend as needed
  let filtered = content.trim();
  
  // Remove excessive whitespace
  filtered = filtered.replace(/\s+/g, ' ');
  
  // Limit message length
  if (filtered.length > 500) {
    filtered = filtered.substring(0, 500) + '...';
  }

  return filtered;
};

export default createChatEventHandlers;