// Modernized HeaderBar component
// Gradient header with rounded design replacing MUI implementation

import React from 'react'
import styled, {css, keyframes} from 'styled-components'
import {motion} from 'framer-motion'
import {LogOut as ExitIcon, HelpCircle as HelpIcon, Users as PeopleIcon} from 'lucide-react'
import {Button, buttonInteractions} from '../../../components/ui'

// Pulse animation keyframes
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`

// Main header container with gradient background
const HeaderContainer = styled(motion.header)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.semanticSpacing.component.md};
  
  /* Gradient background as specified */
  background: linear-gradient(135deg, #ffffff, #f1f5f9);
  
  /* Rounded bottom corners only */
  border-radius: 0 0 16px 16px;
  
  /* Subtle bottom shadow */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  /* Responsive flex wrapping */
  flex-wrap: wrap;
  
  /* Mobile adjustments */
  @media (max-width: 767px) {
    gap: ${({ theme }) => theme.spacing[3]};
    padding: ${({ theme }) => theme.semanticSpacing.component.sm};
  }
`

// Room title section
const RoomTitle = styled.div`
  flex-grow: 1;
  min-width: 200px;
  
  h1 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSize.lg};
    font-weight: ${({ theme }) => theme.fontWeight.semiBold};
    line-height: ${({ theme }) => theme.lineHeight.snug};
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  /* Mobile adjustments */
  @media (max-width: 767px) {
    min-width: 150px;
    
    h1 {
      font-size: ${({ theme }) => theme.fontSize.base};
    }
  }
`

// Status badge
const StatusBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  text-transform: uppercase;
  border: 1px solid;
  transition: ${({ theme }) => theme.transition.default};
  
  /* Icon styling */
  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  
  /* Mobile size adjustments */
  ${({ $isMobile }) => $isMobile && css`
    padding: ${({ theme }) => `${theme.spacing[0.5]} ${theme.spacing[2]}`};
    font-size: ${({ theme }) => theme.fontSize.xs};
    
    svg {
      width: 14px;
      height: 14px;
    }
  `}
  
  /* Pulse animation for active states */
  ${({ $shouldPulse }) => $shouldPulse && css`
    animation: ${pulseAnimation} 2s ease-in-out infinite;
  `}
  
  /* Status colors */
  ${({ $status, theme }) => {
    switch ($status?.toUpperCase()) {
      case 'WAITING':
        return css`
          background-color: ${theme.colors.primary[50]};
          border-color: ${theme.colors.primary[200]};
          color: ${theme.colors.primary[700]};
          svg { color: ${theme.colors.primary[500]}; }
        `
      case 'IN_PROGRESS':
      case 'PLAYING':
      case 'STARTED':
        return css`
          background-color: ${theme.colors.success[50]};
          border-color: ${theme.colors.success[200]};
          color: ${theme.colors.success[700]};
          svg { color: ${theme.colors.success[500]}; }
        `
      case 'FINISHED':
      case 'ENDED':
      case 'COMPLETED':
        return css`
          background-color: ${theme.colors.text.tertiary}15;
          border-color: ${theme.colors.border.secondary};
          color: ${theme.colors.text.secondary};
          svg { color: ${theme.colors.text.tertiary}; }
        `
      default:
        return css`
          background-color: ${theme.colors.surface.secondary};
          border-color: ${theme.colors.border.primary};
          color: ${theme.colors.text.secondary};
          svg { color: ${theme.colors.text.tertiary}; }
        `
    }
  }}
`

// Player count container
const PlayerCountContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary[500]};
    flex-shrink: 0;
  }
  
  .count-text {
    display: flex;
    align-items: baseline;
    gap: 1px;
    
    .current {
      color: ${({ theme }) => theme.colors.text.primary};
      font-weight: ${({ theme }) => theme.fontWeight.semiBold};
    }
    
    .separator {
      color: ${({ theme }) => theme.colors.text.tertiary};
      margin: 0 2px;
    }
    
    .max {
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }
`

// Action buttons container
const ActionButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  
  /* Mobile adjustments */
  @media (max-width: 767px) {
    gap: ${({ theme }) => theme.spacing[1]};
  }
`

// Leave button with error styling
const LeaveButton = styled(Button)`
  border-color: ${({ theme }) => theme.colors.error[300]};
  color: ${({ theme }) => theme.colors.error[600]};
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.error[50]};
    border-color: ${({ theme }) => theme.colors.error[400]};
    color: ${({ theme }) => theme.colors.error[700]};
    box-shadow: ${({ theme }) => theme.coloredShadows.error};
  }
  
  &:active:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.error[100]};
    border-color: ${({ theme }) => theme.colors.error[500]};
    color: ${({ theme }) => theme.colors.error[800]};
  }
`

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

  return (
    <HeaderContainer
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }}
    >
      <RoomTitle>
        <h1>{getRoomTitle()}</h1>
      </RoomTitle>

      <StatusBadge
        $status={status}
        $isMobile={isMobile}
        $shouldPulse={shouldPulse}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        whileHover={{ scale: 1.05 }}
      >
        {roomStateInfo.icon && <roomStateInfo.icon />}
        {roomStateInfo.text}
      </StatusBadge>

      <PlayerCountContainer>
        <PeopleIcon />
        <span className="count-text">
          <span className="current">{playersCount}</span>
          <span className="separator">/</span>
          <span className="max">{maxPlayers}</span>
        </span>
      </PlayerCountContainer>

      <ActionButtonsContainer>
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
        
        <LeaveButton
          variant="outline"
          size={buttonSize}
          onClick={onOpenLeaveDialog}
          aria-label="게임방 나가기"
          {...buttonInteractions.subtleButton}
          enableRipple={true}
        >
          <ExitIcon style={{ marginRight: '4px' }} />
          {!isMobile && '나가기'}
        </LeaveButton>
      </ActionButtonsContainer>
    </HeaderContainer>
  )
})

HeaderBar.displayName = 'HeaderBar'
export default HeaderBar
