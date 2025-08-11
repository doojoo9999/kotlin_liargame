import React, {useState} from 'react'
import {
    Badge,
    Box,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme
} from '@mui/material'
import {
    CheckCircle as SuccessIcon,
    Close as CloseIcon,
    EmojiEvents as TrophyIcon,
    Error as ErrorIcon,
    ExpandLess as CollapseIcon,
    ExpandMore as ExpandIcon,
    Games as GameIcon,
    HowToVote as VoteIcon,
    Info as InfoIcon,
    Notifications as NotificationIcon,
    Person as PersonIcon,
    Quiz as QuizIcon,
    Security as DefenseIcon,
    Warning as WarningIcon
} from '@mui/icons-material'

// System message types with styling configuration
const MESSAGE_TYPES = {
  GAME_START: { 
    icon: <GameIcon />, 
    color: 'primary', 
    label: '게임 시작',
    priority: 'high'
  },
  TURN_CHANGE: { 
    icon: <PersonIcon />, 
    color: 'info', 
    label: '턴 변경',
    priority: 'medium'
  },
  VOTE_START: { 
    icon: <VoteIcon />, 
    color: 'warning', 
    label: '투표 시작',
    priority: 'high'
  },
  DEFENSE_TIME: { 
    icon: <DefenseIcon />, 
    color: 'error', 
    label: '변론 시간',
    priority: 'high'
  },
  WORD_GUESS: { 
    icon: <QuizIcon />, 
    color: 'secondary', 
    label: '단어 추리',
    priority: 'high'
  },
  GAME_END: { 
    icon: <TrophyIcon />, 
    color: 'success', 
    label: '게임 종료',
    priority: 'high'
  },
  PLAYER_JOIN: { 
    icon: <PersonIcon />, 
    color: 'success', 
    label: '플레이어 입장',
    priority: 'low'
  },
  PLAYER_LEAVE: { 
    icon: <PersonIcon />, 
    color: 'warning', 
    label: '플레이어 퇴장',
    priority: 'medium'
  },
  HINT_SUBMITTED: { 
    icon: <InfoIcon />, 
    color: 'info', 
    label: '힌트 제출',
    priority: 'medium'
  },
  VOTE_CAST: { 
    icon: <VoteIcon />, 
    color: 'info', 
    label: '투표 완료',
    priority: 'medium'
  },
  DEFENSE_SUBMITTED: { 
    icon: <DefenseIcon />, 
    color: 'info', 
    label: '변론 제출',
    priority: 'medium'
  },
  ERROR: { 
    icon: <ErrorIcon />, 
    color: 'error', 
    label: '오류',
    priority: 'high'
  },
  WARNING: { 
    icon: <WarningIcon />, 
    color: 'warning', 
    label: '경고',
    priority: 'medium'
  },
  INFO: { 
    icon: <InfoIcon />, 
    color: 'info', 
    label: '정보',
    priority: 'low'
  },
  SUCCESS: { 
    icon: <SuccessIcon />, 
    color: 'success', 
    label: '성공',
    priority: 'medium'
  }
}

const SystemNotifications = ({
  messages = [],
  gameStatus = 'WAITING',
  onDismissNotification,
  maxMessages = 20,
  autoHideDelay = 10000 // 10 seconds for low priority messages
}) => {
  const theme = useTheme()
  const [expandedMessages, setExpandedMessages] = useState({})
  const [dismissedMessages, setDismissedMessages] = useState(new Set())

  // Filter and sort messages
  const processedMessages = React.useMemo(() => {
    // Convert messages to standardized format
    const standardized = messages
      .filter(msg => !dismissedMessages.has(msg.id))
      .map(msg => ({
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        type: msg.type || 'INFO',
        content: msg.content || msg.message || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        playerId: msg.playerId,
        playerName: msg.playerName || msg.playerNickname,
        data: msg.data || {},
        dismissed: false
      }))

    // Sort by priority and timestamp
    return standardized
      .sort((a, b) => {
        const aPriority = MESSAGE_TYPES[a.type]?.priority || 'low'
        const bPriority = MESSAGE_TYPES[b.type]?.priority || 'low'
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        
        if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
          return priorityOrder[bPriority] - priorityOrder[aPriority]
        }
        
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
      .slice(0, maxMessages)
  }, [messages, dismissedMessages, maxMessages])

  // Handle message dismissal
  const handleDismissMessage = (messageId) => {
    setDismissedMessages(prev => new Set([...prev, messageId]))
    if (onDismissNotification) {
      onDismissNotification(messageId)
    }
  }

  // Handle message expansion
  const handleExpandMessage = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)

    if (diffSeconds < 60) return `${diffSeconds}초 전`
    if (diffMinutes < 60) return `${diffMinutes}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Get message configuration
  const getMessageConfig = (type) => {
    return MESSAGE_TYPES[type] || MESSAGE_TYPES.INFO
  }

  // Count unread high priority messages
  const highPriorityCount = processedMessages.filter(msg => 
    MESSAGE_TYPES[msg.type]?.priority === 'high'
  ).length

  if (processedMessages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <NotificationIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          아직 시스템 알림이 없습니다
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            시스템 알림
          </Typography>
          {highPriorityCount > 0 && (
            <Badge
              badgeContent={highPriorityCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.7rem',
                  height: 16,
                  minWidth: 16
                }
              }}
            >
              <NotificationIcon fontSize="small" />
            </Badge>
          )}
        </Box>
      </Box>

      {/* Messages List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense sx={{ py: 0 }}>
          {processedMessages.map((message) => {
            const config = getMessageConfig(message.type)
            const isExpanded = expandedMessages[message.id]
            const hasLongContent = message.content.length > 80

            return (
              <React.Fragment key={message.id}>
                <ListItem
                  sx={{
                    py: 1,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: config.priority === 'high' 
                      ? `${theme.palette[config.color].light}08`
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        color: `${config.color}.main`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {config.icon}
                    </Box>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={config.label}
                          size="small"
                          color={config.color}
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.65rem',
                            height: 20,
                            fontWeight: config.priority === 'high' ? 'bold' : 'normal'
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" fontSize="0.7rem">
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            color: 'text.primary',
                            display: hasLongContent && !isExpanded ? '-webkit-box' : 'block',
                            WebkitLineClamp: hasLongContent && !isExpanded ? 2 : 'none',
                            WebkitBoxOrient: 'vertical',
                            overflow: hasLongContent && !isExpanded ? 'hidden' : 'visible'
                          }}
                        >
                          {message.playerName && (
                            <strong>{message.playerName}: </strong>
                          )}
                          {message.content}
                        </Typography>

                        {hasLongContent && (
                          <IconButton
                            size="small"
                            onClick={() => handleExpandMessage(message.id)}
                            sx={{ mt: 0.5, p: 0.5 }}
                          >
                            {isExpanded ? (
                              <CollapseIcon fontSize="small" />
                            ) : (
                              <ExpandIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </Box>
                    }
                  />

                  {/* Dismiss Button */}
                  {config.priority !== 'high' && (
                    <IconButton
                      size="small"
                      onClick={() => handleDismissMessage(message.id)}
                      sx={{ ml: 1 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              </React.Fragment>
            )
          })}
        </List>
      </Box>

      {/* Footer with message count */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', backgroundColor: theme.palette.grey[50] }}>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {processedMessages.length}개의 알림
          {dismissedMessages.size > 0 && ` (${dismissedMessages.size}개 숨김)`}
        </Typography>
      </Box>
    </Box>
  )
}

export default SystemNotifications
export { MESSAGE_TYPES }