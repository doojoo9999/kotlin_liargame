import React, {createContext, useContext, useEffect, useState} from 'react'
import {Alert, AlertTitle, Box, IconButton, Slide, Typography, useMediaQuery, useTheme} from '@mui/material'
import {
    CheckCircle as SuccessIcon,
    Close as CloseIcon,
    Error as ErrorIcon,
    ExitToApp as LeaveIcon,
    Info as InfoIcon,
    Person as PlayerIcon,
    PlayArrow as GameStartIcon,
    Warning as WarningIcon,
    Wifi as ConnectedIcon,
    WifiOff as DisconnectedIcon
} from '@mui/icons-material'

// Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SYSTEM: 'system',
  GAME: 'game'
}

// System message types
export const SYSTEM_MESSAGE_TYPES = {
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_STARTED: 'game_started',
  GAME_ENDED: 'game_ended',
  CONNECTION_LOST: 'connection_lost',
  CONNECTION_RESTORED: 'connection_restored',
  PHASE_CHANGED: 'phase_changed'
}

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const addToast = (message, type = TOAST_TYPES.INFO, options = {}) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      message,
      type,
      duration: options.duration || (type === TOAST_TYPES.ERROR ? 6000 : 4000),
      persistent: options.persistent || false,
      action: options.action,
      icon: options.icon,
      title: options.title,
      ...options
    }

    setToasts(prev => [...prev, toast])

    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }

    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // System message helpers
  const showSystemMessage = (type, data = {}) => {
    const systemMessages = {
      [SYSTEM_MESSAGE_TYPES.PLAYER_JOINED]: {
        message: `${data.playerName}님이 입장했습니다`,
        type: TOAST_TYPES.INFO,
        icon: <PlayerIcon />,
        title: '플레이어 입장'
      },
      [SYSTEM_MESSAGE_TYPES.PLAYER_LEFT]: {
        message: `${data.playerName}님이 퇴장했습니다`,
        type: TOAST_TYPES.WARNING,
        icon: <LeaveIcon />,
        title: '플레이어 퇴장'
      },
      [SYSTEM_MESSAGE_TYPES.GAME_STARTED]: {
        message: '게임이 시작되었습니다!',
        type: TOAST_TYPES.SUCCESS,
        icon: <GameStartIcon />,
        title: '게임 시작'
      },
      [SYSTEM_MESSAGE_TYPES.GAME_ENDED]: {
        message: '게임이 종료되었습니다',
        type: TOAST_TYPES.INFO,
        icon: <InfoIcon />,
        title: '게임 종료'
      },
      [SYSTEM_MESSAGE_TYPES.CONNECTION_LOST]: {
        message: '서버 연결이 끊어졌습니다. 재연결을 시도합니다...',
        type: TOAST_TYPES.ERROR,
        icon: <DisconnectedIcon />,
        title: '연결 끊김',
        persistent: true
      },
      [SYSTEM_MESSAGE_TYPES.CONNECTION_RESTORED]: {
        message: '서버 연결이 복구되었습니다',
        type: TOAST_TYPES.SUCCESS,
        icon: <ConnectedIcon />,
        title: '연결 복구'
      },
      [SYSTEM_MESSAGE_TYPES.PHASE_CHANGED]: {
        message: `게임 단계가 변경되었습니다: ${data.phase}`,
        type: TOAST_TYPES.INFO,
        icon: <InfoIcon />,
        title: '단계 변경'
      }
    }

    const messageConfig = systemMessages[type]
    if (messageConfig) {
      addToast(messageConfig.message, messageConfig.type, messageConfig)
    }
  }

  const value = {
    addToast,
    removeToast,
    clearAllToasts,
    showSystemMessage,
    toasts
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} isMobile={isMobile} />
    </ToastContext.Provider>
  )
}

const ToastContainer = ({ toasts, onRemove, isMobile }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: isMobile ? 80 : 100,
        right: isMobile ? 16 : 24,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: isMobile ? 'calc(100vw - 32px)' : 400,
        width: '100%'
      }}
    >
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
          index={index}
          isMobile={isMobile}
        />
      ))}
    </Box>
  )
}

const ToastItem = ({ toast, onRemove, index, isMobile }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(true)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getIcon = () => {
    if (toast.icon) return toast.icon

    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return <SuccessIcon />
      case TOAST_TYPES.ERROR:
        return <ErrorIcon />
      case TOAST_TYPES.WARNING:
        return <WarningIcon />
      case TOAST_TYPES.INFO:
      default:
        return <InfoIcon />
    }
  }

  const getSeverity = () => {
    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return 'success'
      case TOAST_TYPES.ERROR:
        return 'error'
      case TOAST_TYPES.WARNING:
        return 'warning'
      case TOAST_TYPES.INFO:
      case TOAST_TYPES.SYSTEM:
      case TOAST_TYPES.GAME:
      default:
        return 'info'
    }
  }

  return (
    <Slide
      direction="left"
      in={show}
      timeout={300}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        {toast.title && (
          <AlertTitle sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1rem' }}>
            {toast.title}
          </AlertTitle>
        )}
        <Typography variant={isMobile ? 'body2' : 'body1'}>
          {toast.message}
        </Typography>
        {toast.action && (
          <Box sx={{ mt: 1 }}>
            {toast.action}
          </Box>
        )}
      </Alert>
    </Slide>
  )
}

// Enhanced WebSocket message handler component
export const WebSocketMessageHandler = ({ children }) => {
  const { showSystemMessage, addToast } = useToast()

  useEffect(() => {
    // Listen for WebSocket events and show appropriate toasts
    const handleWebSocketMessage = (event) => {
      const { type, data } = event.detail || {}

      switch (type) {
        case 'player_joined':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.PLAYER_JOINED, data)
          break
        case 'player_left':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.PLAYER_LEFT, data)
          break
        case 'game_started':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.GAME_STARTED, data)
          break
        case 'game_ended':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.GAME_ENDED, data)
          break
        case 'connection_lost':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.CONNECTION_LOST, data)
          break
        case 'connection_restored':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.CONNECTION_RESTORED, data)
          break
        case 'phase_changed':
          showSystemMessage(SYSTEM_MESSAGE_TYPES.PHASE_CHANGED, data)
          break
        case 'error':
          addToast(data.message || '오류가 발생했습니다', TOAST_TYPES.ERROR, {
            title: '오류',
            duration: 6000
          })
          break
        case 'success':
          addToast(data.message || '성공했습니다', TOAST_TYPES.SUCCESS, {
            title: '성공'
          })
          break
        default:
          break
      }
    }

    window.addEventListener('websocket-message', handleWebSocketMessage)
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage)
    }
  }, [showSystemMessage, addToast])

  return children
}

export default ToastProvider