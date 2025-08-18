// Modernized HeaderBar component
// Gradient header with rounded design replacing MUI implementation

import React from 'react'
import {motion} from 'framer-motion'
import {HelpCircle as HelpIcon, LogOut as ExitIcon, Users as PeopleIcon} from 'lucide-react'
import {Button, buttonInteractions} from '../../../components/ui'

// Pulse animation keyframes


const HeaderBar = React.memo(function HeaderBar({
  currentRoom,
  isMobile,
  roomStateInfo,
  playersCount,
  maxPlayers,
  onOpenTutorial,
  onOpenLeaveDialog,
}) {
  // Generate room title with same logic as original
  const getRoomTitle = () => {
    let title = currentRoom.title || `${currentRoom.gameName || '제목 없음'} #${currentRoom.gameNumber}`
    
    // Add subjects if available
    if (currentRoom.subjects && currentRoom.subjects.length > 0) {
      title += ` - [${currentRoom.subjects.join(', ')}]`
    } else if (!currentRoom.subjects && currentRoom.subject) {
      const subjectName = currentRoom.subject?.name || currentRoom.subject?.content || '주제 없음'
      title += ` - [${subjectName}]`
    }
    
    return title
  }

  // Extract status from roomStateInfo for badge
  const getStatusFromColor = (color) => {
    switch (color) {
      case 'warning':
        return 'WAITING'
      case 'success':
        return 'IN_PROGRESS'
      case 'default':
      case 'secondary':
        return 'FINISHED'
      case 'error':
        return 'ERROR'
      default:
        return 'WAITING'
    }
  }

  const status = getStatusFromColor(roomStateInfo.color)
  const shouldPulse = ['WAITING', 'IN_PROGRESS', 'PLAYING', 'STARTED'].includes(status?.toUpperCase())
  const buttonSize = isMobile ? 'small' : 'medium'

  const getStatusBadgeStyles = (status, isMobile, shouldPulse) => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: isMobile ? '2px 8px' : '4px 12px',
      borderRadius: '9999px',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: 500,
      letterSpacing: '0.025em',
      textTransform: 'uppercase',
      border: '1px solid',
      transition: 'all 0.2s ease',
      animation: shouldPulse ? 'pulse 2s ease-in-out infinite' : 'none'
    }

    switch (status?.toUpperCase()) {
      case 'WAITING':
        return {
          ...baseStyles,
          backgroundColor: '#e0e7ff',
          borderColor: '#a5b4fc',
          color: '#4338ca',
          '& svg': { color: '#6366f1' }
        }
      case 'IN_PROGRESS':
      case 'PLAYING':
      case 'STARTED':
        return {
          ...baseStyles,
          backgroundColor: '#dcfce7',
          borderColor: '#86efac',
          color: '#15803d',
          '& svg': { color: '#22c55e' }
        }
      case 'FINISHED':
      case 'ENDED':
      case 'COMPLETED':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: '#d1d5db',
          color: '#6b7280',
          '& svg': { color: '#9ca3af' }
        }
      default:
        return {
          ...baseStyles,
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
          color: '#6b7280',
          '& svg': { color: '#9ca3af' }
        }
    }
  }

  return (
    <motion.header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '12px' : '16px',
        padding: isMobile ? '12px' : '16px',
        background: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        flexWrap: 'wrap'
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
    >
      <div style={{
        flexGrow: 1,
        minWidth: isMobile ? '150px' : '200px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 600,
          lineHeight: 1.4,
          color: '#1f2937'
        }}>
          {getRoomTitle()}
        </h1>
      </div>

      <motion.div
        style={getStatusBadgeStyles(status, isMobile, shouldPulse)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        whileHover={{ scale: 1.05 }}
      >
        {roomStateInfo.icon && <roomStateInfo.icon style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px', flexShrink: 0 }} />}
        {roomStateInfo.text}
      </motion.div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: '#6b7280',
        fontSize: '14px',
        fontWeight: 500
      }}>
        <PeopleIcon style={{ width: '18px', height: '18px', color: '#6366f1', flexShrink: 0 }} />
        <span style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '1px'
        }}>
          <span style={{ color: '#1f2937', fontWeight: 600 }}>{playersCount}</span>
          <span style={{ color: '#9ca3af', margin: '0 2px' }}>/</span>
          <span style={{ color: '#6b7280' }}>{maxPlayers}</span>
        </span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '4px' : '8px'
      }}>
        <Button
          variant="outline"
          size={buttonSize}
          onClick={onOpenTutorial}
          aria-label="게임 도움말 보기"
          {...buttonInteractions.subtleButton}
          enableRipple={true}
        >
          <HelpIcon style={{ marginRight: '4px' }} />
          {!isMobile && '도움말'}
        </Button>
        
        <Button
          variant="outline"
          size={buttonSize}
          onClick={onOpenLeaveDialog}
          aria-label="게임방 나가기"
          {...buttonInteractions.subtleButton}
          enableRipple={true}
          style={{
            borderColor: '#fca5a5',
            color: '#dc2626',
            '&:hover:not(:disabled)': {
              backgroundColor: '#fef2f2',
              borderColor: '#f87171',
              color: '#b91c1c',
              boxShadow: '0 4px 6px rgba(220, 38, 38, 0.1)'
            },
            '&:active:not(:disabled)': {
              backgroundColor: '#fee2e2',
              borderColor: '#ef4444',
              color: '#991b1b'
            }
          }}
        >
          <ExitIcon style={{ marginRight: '4px' }} />
          {!isMobile && '나가기'}
        </Button>
      </div>
    </motion.header>
  )
})

HeaderBar.displayName = 'HeaderBar'
export default HeaderBar
