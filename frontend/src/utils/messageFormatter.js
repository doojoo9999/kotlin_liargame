/**
 * Message formatting utilities for chat message UI optimization
 * Handles text processing, timestamp formatting, and content validation
 */

/**
 * Format timestamp for display in various formats
 * @param {string|Date} timestamp - Timestamp to format
 * @param {string} format - Format type ('time', 'date', 'datetime', 'relative')
 * @param {string} locale - Locale for formatting (default: 'ko-KR')
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, format = 'time', locale = 'ko-KR') => {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      // Try to extract time from string format like "HH:MM"
      const timeMatch = String(timestamp).match(/(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      }
      return ''
    }
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diff / (1000 * 60))
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    switch (format) {
      case 'time':
        return date.toLocaleTimeString(locale, {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
      
      case 'date':
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      
      case 'datetime':
        return date.toLocaleString(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      
      case 'relative':
        if (diffMinutes < 1) return '방금 전'
        if (diffMinutes < 60) return `${diffMinutes}분 전`
        if (diffHours < 24) return `${diffHours}시간 전`
        if (diffDays < 7) return `${diffDays}일 전`
        return date.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric'
        })
      
      default:
        return date.toLocaleTimeString(locale, {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        })
    }
  } catch (error) {
    console.warn('[DEBUG_LOG] Failed to format timestamp:', timestamp, error)
    return ''
  }
}

/**
 * Truncate message content to specified length
 * @param {string} content - Message content
 * @param {number} maxLength - Maximum length
 * @param {string} ellipsis - Ellipsis character
 * @returns {string} Truncated content
 */
export const truncateMessage = (content, maxLength = 100, ellipsis = '...') => {
  if (!content || content.length <= maxLength) return content
  
  // Try to break at word boundary
  const truncated = content.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + ellipsis
  }
  
  return truncated + ellipsis
}

/**
 * Sanitize and validate message content
 * @param {string} content - Raw message content
 * @param {Object} options - Validation options
 * @returns {Object} Sanitized content and validation result
 */
export const sanitizeMessage = (content, options = {}) => {
  const {
    maxLength = 500,
    allowHtml = false,
    allowEmoji = true,
    allowUrls = true,
    trimWhitespace = true
  } = options
  
  if (!content || typeof content !== 'string') {
    return {
      content: '',
      isValid: false,
      errors: ['Invalid content type']
    }
  }
  
  const errors = []
  let sanitized = content
  
  // Trim whitespace if enabled
  if (trimWhitespace) {
    sanitized = sanitized.trim()
  }
  
  // Check length
  if (sanitized.length === 0) {
    return {
      content: '',
      isValid: false,
      errors: ['Content is empty']
    }
  }
  
  if (sanitized.length > maxLength) {
    errors.push(`Content exceeds maximum length of ${maxLength} characters`)
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }
  
  // Remove emoji if not allowed
  if (!allowEmoji) {
    sanitized = sanitized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
  }
  
  // Validate URLs if allowed
  if (allowUrls) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = sanitized.match(urlRegex)
    if (urls) {
      // Basic URL validation
      urls.forEach(url => {
        try {
          new URL(url)
        } catch (e) {
          errors.push(`Invalid URL: ${url}`)
        }
      })
    }
  }
  
  return {
    content: sanitized,
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format user name for display
 * @param {string} name - Raw user name
 * @param {number} maxLength - Maximum display length
 * @returns {string} Formatted name
 */
export const formatUserName = (name, maxLength = 20) => {
  if (!name) return '익명'
  
  const trimmed = String(name).trim()
  if (trimmed.length === 0) return '익명'
  if (trimmed.length <= maxLength) return trimmed
  
  // For Korean names, be more conservative with truncation
  if (/[가-힣]/.test(trimmed)) {
    const koreanMaxLength = Math.min(maxLength, 10)
    return trimmed.substring(0, koreanMaxLength) + '...'
  }
  
  return trimmed.substring(0, maxLength) + '...'
}

/**
 * Parse and format URLs in message content
 * @param {string} content - Message content
 * @param {Object} options - URL formatting options
 * @returns {string} Content with formatted URLs
 */
export const formatUrls = (content, options = {}) => {
  const {
    makeClickable = false,
    shortenUrls = true,
    maxUrlLength = 30,
    target = '_blank',
    className = 'chat-url'
  } = options
  
  if (!content) return content
  
  const urlRegex = /(https?:\/\/[^\s]+)/g
  
  return content.replace(urlRegex, (url) => {
    let displayUrl = url
    
    if (shortenUrls && url.length > maxUrlLength) {
      const domain = url.replace(/^https?:\/\//i, '').split('/')[0]
      displayUrl = `${domain}/...`
    }
    
    if (makeClickable) {
      return `<a href="${url}" target="${target}" class="${className}" rel="noopener noreferrer">${displayUrl}</a>`
    }
    
    return displayUrl
  })
}

/**
 * Detect and format mentions in message content
 * @param {string} content - Message content
 * @param {Array} users - Available users for mention
 * @param {Object} options - Mention formatting options
 * @returns {Object} Formatted content and detected mentions
 */
export const formatMentions = (content, users = [], options = {}) => {
  const {
    mentionPrefix = '@',
    className = 'chat-mention',
    caseSensitive = false
  } = options
  
  if (!content || users.length === 0) {
    return {
      content,
      mentions: []
    }
  }
  
  const mentions = []
  let formattedContent = content
  
  users.forEach(user => {
    const userName = user.nickname || user.name || user.playerNickname
    if (!userName) return
    
    const mentionPattern = new RegExp(
      `\\${mentionPrefix}(${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`,
      caseSensitive ? 'g' : 'gi'
    )
    
    formattedContent = formattedContent.replace(mentionPattern, (match, name) => {
      mentions.push({
        userId: user.id || user.playerId,
        userName: name,
        fullMatch: match
      })
      return `<span class="${className}" data-user-id="${user.id || user.playerId}">${match}</span>`
    })
  })
  
  return {
    content: formattedContent,
    mentions: [...new Set(mentions)] // Remove duplicates
  }
}

/**
 * Format system message content
 * @param {string} type - System message type
 * @param {Object} data - Message data
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted system message
 */
export const formatSystemMessage = (type, data = {}, locale = 'ko-KR') => {
  const { userName, action, target, count, time } = data
  
  switch (type) {
    case 'user_joined':
      return `${userName}님이 입장했습니다.`
    
    case 'user_left':
      return `${userName}님이 퇴장했습니다.`
    
    case 'game_started':
      return '게임이 시작되었습니다!'
    
    case 'game_ended':
      return '게임이 종료되었습니다.'
    
    case 'round_started':
      return `라운드 ${count}이 시작되었습니다.`
    
    case 'voting_started':
      return '투표가 시작되었습니다.'
    
    case 'voting_ended':
      return '투표가 종료되었습니다.'
    
    case 'user_eliminated':
      return `${userName}님이 탈락했습니다.`
    
    case 'time_warning':
      return `${time}초 남았습니다!`
    
    default:
      return data.content || '시스템 메시지'
  }
}

/**
 * Validate message data structure
 * @param {Object} message - Message object
 * @returns {Object} Validation result
 */
export const validateMessageData = (message) => {
  const errors = []
  const warnings = []
  
  // Required fields
  if (!message.id) errors.push('Missing message ID')
  if (!message.content) errors.push('Missing message content')
  
  // Optional but recommended fields
  if (!message.timestamp && !message.createdAt) {
    warnings.push('Missing timestamp information')
  }
  
  if (!message.isSystem) {
    if (!message.playerNickname && !message.sender) {
      warnings.push('Missing sender information')
    }
  }
  
  // Content validation
  if (message.content && typeof message.content !== 'string') {
    errors.push('Content must be a string')
  }
  
  if (message.content && message.content.length === 0) {
    errors.push('Content cannot be empty')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Get message preview for notifications
 * @param {Object} message - Message object
 * @param {number} maxLength - Maximum preview length
 * @returns {string} Message preview
 */
export const getMessagePreview = (message, maxLength = 50) => {
  if (message.isSystem) {
    return truncateMessage(message.content, maxLength)
  }
  
  const sender = formatUserName(message.playerNickname || message.sender)
  const content = truncateMessage(message.content, maxLength - sender.length - 2)
  
  return `${sender}: ${content}`
}

export default {
  formatTimestamp,
  truncateMessage,
  sanitizeMessage,
  formatUserName,
  formatUrls,
  formatMentions,
  formatSystemMessage,
  validateMessageData,
  getMessagePreview
}