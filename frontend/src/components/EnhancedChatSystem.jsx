import React, {useEffect, useRef, useState} from 'react'
import {
    Avatar,
    Box,
    Chip,
    Divider,
    Fade,
    IconButton,
    InputAdornment,
    Menu,
    Paper,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material'
import {
    CheckCircle as SuccessIcon,
    Computer as SystemIcon,
    EmojiEmotions as EmojiIcon,
    Info as InfoIcon,
    Person as PersonIcon,
    Send as SendIcon,
    Warning as WarningIcon
} from '@mui/icons-material'

// Common emojis for the game
const GAME_EMOJIS = [
  '😀', '😂', '🤔', '😮', '😱', '🤨', '😏', '🙄',
  '👍', '👎', '👏', '🤝', '✋', '👋', '🤷', '🤦',
  '❤️', '💯', '🔥', '⭐', '❓', '❗', '💭', '💡',
  '🎭', '🕵️', '👥', '🎯', '🎲', '🏆', '⚡', '💀'
]

// Message types
export const MESSAGE_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  GAME_EVENT: 'game_event'
}

const EnhancedChatSystem = ({
  messages = [],
  currentUser,
  onSendMessage,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  maxLength = 200
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [inputValue, setInputValue] = useState('')
  const [emojiMenuAnchor, setEmojiMenuAnchor] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || disabled) return
    
    onSendMessage(inputValue.trim())
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji) => {
    setInputValue(prev => prev + emoji)
    setEmojiMenuAnchor(null)
    inputRef.current?.focus()
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case MESSAGE_TYPES.SYSTEM:
        return <SystemIcon fontSize="small" />
      case MESSAGE_TYPES.INFO:
        return <InfoIcon fontSize="small" />
      case MESSAGE_TYPES.WARNING:
        return <WarningIcon fontSize="small" />
      case MESSAGE_TYPES.SUCCESS:
        return <SuccessIcon fontSize="small" />
      case MESSAGE_TYPES.GAME_EVENT:
        return <span style={{ fontSize: '16px' }}>🎮</span>
      default:
        return <PersonIcon fontSize="small" />
    }
  }

  const getMessageColor = (type) => {
    switch (type) {
      case MESSAGE_TYPES.SYSTEM:
        return 'info'
      case MESSAGE_TYPES.INFO:
        return 'info'
      case MESSAGE_TYPES.WARNING:
        return 'warning'
      case MESSAGE_TYPES.SUCCESS:
        return 'success'
      case MESSAGE_TYPES.GAME_EVENT:
        return 'secondary'
      default:
        return 'default'
    }
  }

  const isSystemMessage = (type) => {
    return [
      MESSAGE_TYPES.SYSTEM,
      MESSAGE_TYPES.INFO,
      MESSAGE_TYPES.WARNING,
      MESSAGE_TYPES.SUCCESS,
      MESSAGE_TYPES.GAME_EVENT
    ].includes(type)
  }

  const renderMessage = (message, index) => {
    const isSystem = isSystemMessage(message.type)
    const isOwnMessage = !isSystem && message.playerId === currentUser?.id
    const showAvatar = !isSystem && (!messages[index - 1] || 
      messages[index - 1].playerId !== message.playerId ||
      isSystemMessage(messages[index - 1].type))

    if (isSystem) {
      return (
        <Fade in key={message.id || index} timeout={300}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            my: 1 
          }}>
            <Chip
              icon={getMessageIcon(message.type)}
              label={message.content}
              color={getMessageColor(message.type)}
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                maxWidth: '80%',
                height: 'auto',
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  padding: '8px 12px'
                }
              }}
            />
          </Box>
        </Fade>
      )
    }

    return (
      <Fade in key={message.id || index} timeout={300}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isOwnMessage ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            mb: 1,
            gap: 1
          }}
        >
          {/* Avatar */}
          {showAvatar && !isOwnMessage && (
            <Avatar
              sx={{
                width: isMobile ? 32 : 40,
                height: isMobile ? 32 : 40,
                bgcolor: `hsl(${(message.playerId || 0) * 30}, 70%, 50%)`,
                fontSize: isMobile ? '0.8rem' : '1rem'
              }}
            >
              {message.playerNickname?.charAt(0) || '?'}
            </Avatar>
          )}

          {/* Message bubble */}
          <Box
            sx={{
              maxWidth: '70%',
              minWidth: '60px'
            }}
          >
            {/* Nickname (only for others' messages and when showing avatar) */}
            {showAvatar && !isOwnMessage && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  ml: 1,
                  mb: 0.5,
                  color: 'text.secondary',
                  fontSize: isMobile ? '0.7rem' : '0.75rem'
                }}
              >
                {message.playerNickname}
              </Typography>
            )}

            {/* Message content */}
            <Paper
              elevation={1}
              sx={{
                p: isMobile ? 1 : 1.5,
                bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                borderTopLeftRadius: !isOwnMessage && showAvatar ? 0 : 2,
                borderTopRightRadius: isOwnMessage && showAvatar ? 0 : 2,
                wordBreak: 'break-word'
              }}
            >
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                sx={{ 
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  lineHeight: 1.4
                }}
              >
                {message.content}
              </Typography>

              {/* Timestamp */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  opacity: 0.7,
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  textAlign: isOwnMessage ? 'right' : 'left'
                }}
              >
                {formatTimestamp(message.timestamp)}
              </Typography>
            </Paper>
          </Box>

          {/* Own message avatar placeholder */}
          {showAvatar && isOwnMessage && (
            <Box sx={{ width: isMobile ? 32 : 40 }} />
          )}
        </Box>
      </Fade>
    )
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: isMobile ? 1 : 2,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '3px'
          }
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary'
            }}
          >
            <Typography variant="body2" sx={{ mb: 1 }}>
              아직 메시지가 없습니다
            </Typography>
            <Typography variant="caption">
              첫 번째 메시지를 보내보세요! 💬
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <Divider />

      {/* Input area */}
      <Box sx={{ p: isMobile ? 1 : 2 }}>
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.slice(0, maxLength))}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          size={isMobile ? 'small' : 'medium'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {/* Emoji button */}
                  <IconButton
                    size="small"
                    onClick={(e) => setEmojiMenuAnchor(e.currentTarget)}
                    disabled={disabled}
                  >
                    <EmojiIcon />
                  </IconButton>

                  {/* Send button */}
                  <IconButton
                    size="small"
                    onClick={handleSendMessage}
                    disabled={disabled || !inputValue.trim()}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </InputAdornment>
            )
          }}
          helperText={`${inputValue.length}/${maxLength}`}
        />

        {/* Emoji menu */}
        <Menu
          anchorEl={emojiMenuAnchor}
          open={Boolean(emojiMenuAnchor)}
          onClose={() => setEmojiMenuAnchor(null)}
          PaperProps={{
            sx: {
              maxHeight: 200,
              width: isMobile ? 280 : 320
            }
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
              자주 사용하는 이모지
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 0.5
              }}
            >
              {GAME_EMOJIS.map((emoji, index) => (
                <IconButton
                  key={index}
                  size="small"
                  onClick={() => handleEmojiSelect(emoji)}
                  sx={{
                    fontSize: '1.2rem',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Menu>
      </Box>
    </Box>
  )
}

export default EnhancedChatSystem