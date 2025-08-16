import React, {useMemo, useState} from 'react'
import {Box, Chip, Divider, Input as TextField, Typography} from './ui'
import {
    Filter as FilterIcon,
    Gamepad2 as GameIcon,
    Heart as HeartIcon,
    Info as InfoIcon,
    Lightbulb as LightbulbIcon,
    MessageCircle as ChatIcon,
    Send as SendIcon,
    Smile as EmojiIcon,
    ThumbsDown as ThumbDownIcon,
    ThumbsUp as ThumbUpIcon
} from 'lucide-react'
import OptimizedEnhancedChatSystem from './OptimizedEnhancedChatSystem'

// Quick reaction emojis
const QUICK_REACTIONS = [
  { emoji: '👍', label: '좋아요', icon: <ThumbUpIcon /> },
  { emoji: '👎', label: '별로', icon: <ThumbDownIcon /> },
  { emoji: '❤️', label: '하트', icon: <HeartIcon /> },
  { emoji: '💡', label: '아이디어', icon: <LightbulbIcon /> },
  { emoji: '😂', label: '웃김', icon: null },
  { emoji: '🤔', label: '생각', icon: null },
  { emoji: '😮', label: '놀람', icon: null },
  { emoji: '🎯', label: '정확', icon: null }
]

// Message type filters
const MESSAGE_FILTERS = {
  ALL: { label: '전체', value: 'all' },
  USER: { label: '일반', value: 'user' },
  SYSTEM: { label: '시스템', value: 'system' },
  GAME: { label: '게임 로그', value: 'game_event' },
  INFO: { label: '정보', value: 'info' }
}

const ExpandedChatPanel = ({
  messages = [],
  currentUser,
  onSendMessage,
  disabled = false,
  gameStatus = 'WAITING',
  players = [],
  systemMessages = []
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [messageFilter, setMessageFilter] = useState('all')
  const [inputValue, setInputValue] = useState('')

  // Combine and categorize messages
  const categorizedMessages = useMemo(() => {
    // General chat messages
    const chatMessages = messages.map(msg => ({
      ...msg,
      category: 'chat',
      type: msg.type || 'user'
    }))

    // System messages
    const systemMsgs = systemMessages.map(msg => ({
      ...msg,
      id: msg.id || `sys-${Date.now()}-${Math.random()}`,
      category: 'system',
      type: 'system',
      playerNickname: 'System',
      content: msg.content || msg.message || ''
    }))

    // Game event messages (derived from game state changes)
    const gameEvents = []
    
    // Add game events based on current state
    if (gameStatus === 'HINT_PHASE') {
      gameEvents.push({
        id: `event-hint-${Date.now()}`,
        category: 'game',
        type: 'game_event',
        playerNickname: 'Game',
        content: '힌트 제출 단계가 시작되었습니다.',
        timestamp: new Date().toISOString()
      })
    }

    return {
      all: [...chatMessages, ...systemMsgs, ...gameEvents]
        .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)),
      chat: chatMessages,
      system: systemMsgs,
      game: gameEvents
    }
  }, [messages, systemMessages, gameStatus])

  // Filter messages based on active filter
  const filteredMessages = useMemo(() => {
    const allMessages = categorizedMessages.all
    
    if (messageFilter === 'all') {
      return allMessages
    }
    
    return allMessages.filter(msg => {
      switch (messageFilter) {
        case 'user':
          return msg.type === 'user' || msg.type === 'USER'
        case 'system':
          return msg.type === 'system' || msg.type === 'SYSTEM'
        case 'game_event':
          return msg.type === 'game_event' || msg.type === 'GAME_EVENT'
        case 'info':
          return msg.type === 'info' || msg.type === 'INFO'
        default:
          return true
      }
    })
  }, [categorizedMessages, messageFilter])

  // Get message counts for each category
  const getMessageCounts = () => {
    return {
      all: categorizedMessages.all.length,
      chat: categorizedMessages.chat.length,
      system: categorizedMessages.system.length,
      game: categorizedMessages.game.length,
      unread: 0 // Would need to track read status
    }
  }

  const messageCounts = getMessageCounts()

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    
    // Update message filter based on tab
    switch (newValue) {
      case 0: // All Chat
        setMessageFilter('all')
        break
      case 1: // System Messages
        setMessageFilter('system')
        break
      case 2: // Game Log
        setMessageFilter('game_event')
        break
      default:
        setMessageFilter('all')
    }
  }

  // Handle message send
  const handleSendMessage = (content) => {
    if (content.trim() && onSendMessage) {
      onSendMessage(content.trim())
      setInputValue('')
    }
  }

  // Handle quick reaction
  const handleQuickReaction = (emoji) => {
    handleSendMessage(emoji)
  }

  // Handle key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper
      }}
    >
      {/* Header with Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.8rem',
              textTransform: 'none'
            }
          }}
        >
          <Tab
            icon={
              <Badge badgeContent={messageCounts.unread} color="error">
                <ChatIcon />
              </Badge>
            }
            label="전체 채팅"
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={messageCounts.system} color="info">
                <InfoIcon />
              </Badge>
            }
            label="시스템"
            iconPosition="start"
          />
          <Tab
            icon={
              <Badge badgeContent={messageCounts.game} color="secondary">
                <GameIcon />
              </Badge>
            }
            label="게임 로그"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[50] }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FilterIcon fontSize="small" color="action" />
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {Object.entries(MESSAGE_FILTERS).map(([key, filter]) => (
              <Chip
                key={key}
                label={filter.label}
                size="small"
                variant={messageFilter === filter.value ? 'filled' : 'outlined'}
                color={messageFilter === filter.value ? 'primary' : 'default'}
                onClick={() => setMessageFilter(filter.value)}
                sx={{ fontSize: '0.7rem', height: 24 }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredMessages.length}개 메시지
          </Typography>
        </Stack>
      </Box>

      {/* Chat Messages Area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <OptimizedEnhancedChatSystem
          messages={filteredMessages}
          currentUser={currentUser}
          onSendMessage={() => {}} // Handle through expanded input area
          disabled={true} // Disable built-in input
          placeholder=""
        />
      </Box>

      <Divider />

      {/* Quick Reactions Bar */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {QUICK_REACTIONS.map((reaction) => (
            <IconButton
              key={reaction.emoji}
              size="small"
              onClick={() => handleQuickReaction(reaction.emoji)}
              disabled={disabled}
              title={reaction.label}
              sx={{
                minWidth: 32,
                height: 32,
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              {reaction.icon || reaction.emoji}
            </IconButton>
          ))}
        </Stack>
      </Box>

      {/* Enhanced Input Area */}
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "채팅이 비활성화되었습니다..." : "메시지를 입력하세요..."}
          disabled={disabled}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    onClick={() => {
                      // Add emoji picker functionality here
                    }}
                  >
                    <EmojiIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={disabled || !inputValue.trim()}
                    onClick={() => handleSendMessage(inputValue)}
                  >
                    <SendIcon />
                  </IconButton>
                </Stack>
              </InputAdornment>
            ),
            sx: {
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.divider
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              paddingRight: 1
            }
          }}
        />

        {/* Character Counter */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {activeTab === 0 && '전체 채팅'}
            {activeTab === 1 && '시스템 메시지만 표시'}
            {activeTab === 2 && '게임 이벤트만 표시'}
          </Typography>
          <Typography
            variant="caption"
            color={inputValue.length > 180 ? 'error' : 'text.secondary'}
          >
            {inputValue.length}/200
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default ExpandedChatPanel