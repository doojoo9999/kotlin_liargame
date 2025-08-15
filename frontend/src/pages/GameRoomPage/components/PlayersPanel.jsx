// Modernized PlayersPanel component
// CSS Grid layout with player cards and staggered animations

import React, {useState} from 'react'
import styled, {css} from 'styled-components'
import {AnimatePresence, motion} from 'framer-motion'
import {Box, Typography} from '../../../components/ui'
import {UserPlus as PersonAddIcon, Flag as ReportIcon} from 'lucide-react'
import UserAvatar from '../../../components/UserAvatar'

// Players panel container
const PlayersPanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
`

// Players grid using CSS Grid
const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: ${({ theme }) => theme.spacing[4]};
  width: 100%;
  justify-items: center;
  
  /* Responsive grid adjustments */
  @media (max-width: 767px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: ${({ theme }) => theme.spacing[3]};
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

// Empty state container
const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: ${({ theme }) => theme.semanticSpacing.component.xl};
  text-align: center;
  border: 2px dashed ${({ theme }) => theme.colors.border.secondary};
  border-radius: ${({ theme }) => theme.semanticBorderRadius.card.medium};
  background-color: ${({ theme }) => theme.colors.surface.secondary};
  min-height: 200px;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    opacity: 0.5;
  }
`

// Card container with hover and turn effects
const CardContainer = styled(motion.div)`
  position: relative;
  width: 160px;
  height: 120px;
  background-color: ${({ theme }) => theme.colors.surface.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.semanticBorderRadius.card.medium};
  box-shadow: ${({ theme }) => theme.semanticShadows.card.default};
  cursor: pointer;
  overflow: hidden;
  transition: ${({ theme }) => theme.semanticTransitions.card.hover};
  
  /* Hover effects */
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-color: ${({ theme }) => theme.colors.border.secondary};
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
  
  /* Current turn highlighting */
  ${({ $isTurn, theme }) => $isTurn && css`
    border: 2px solid ${theme.colors.primary[500]};
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.3), ${theme.shadows.md};
    
    /* Pulse animation */
    animation: ${theme.animations.game.countdownPulse};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, ${theme.colors.primary[500]}, ${theme.colors.secondary[500]});
      z-index: 1;
    }
  `}
  
  /* Mobile size adjustments */
  ${({ theme }) => css`
    @media (max-width: 767px) {
      width: 140px;
      height: 100px;
    }
  `}
`

// Card content layout
const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing[3]};
  height: 100%;
  gap: ${({ theme }) => theme.spacing[1]};
`

// Top section with avatar and status
const TopSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`

// Avatar container with status indicator
const AvatarContainer = styled.div`
  position: relative;
  flex-shrink: 0;
`

// Online status dot
const StatusDot = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.surface.primary};
  background-color: ${({ $isOnline, theme }) => 
    $isOnline ? theme.colors.success[500] : theme.colors.text.tertiary};
  z-index: 2;
`

// Player info section
const PlayerInfo = styled.div`
  flex: 1;
  min-width: 0; /* Allow text truncation */
`

// Player nickname
const PlayerNickname = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.semiBold};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: ${({ theme }) => theme.lineHeight.none};
`

// Role badge
const RoleBadge = styled.div`
  display: inline-block;
  padding: ${({ theme }) => `2px ${theme.spacing[1]}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  text-transform: uppercase;
  margin-top: 2px;
  
  ${({ $role, theme }) => {
    switch ($role) {
      case 'liar':
        return css`
          background-color: ${theme.colors.game.liar[100]};
          color: ${theme.colors.game.liar[700]};
          border: 1px solid ${theme.colors.game.liar[300]};
        `
      case 'citizen':
        return css`
          background-color: ${theme.colors.game.citizen[100]};
          color: ${theme.colors.game.citizen[700]};
          border: 1px solid ${theme.colors.game.citizen[300]};
        `
      default:
        return css`
          background-color: ${theme.colors.surface.secondary};
          color: ${theme.colors.text.secondary};
          border: 1px solid ${theme.colors.border.primary};
        `
    }
  }}
`

// Bottom section with status and actions
const BottomSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
`

// Status text
const StatusText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  
  /* Crown icon for room owner */
  .crown-icon {
    color: ${({ theme }) => theme.colors.warning[500]};
  }
`

// Action buttons container
const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[0.5]};
  opacity: 0;
  transition: ${({ theme }) => theme.transition.fast};
  
  ${CardContainer}:hover & {
    opacity: 1;
  }
`

// Action button
const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.surface.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  transition: ${({ theme }) => theme.transition.fast};
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[100]};
    color: ${({ theme }) => theme.colors.primary[600]};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  /* Report button styling */
  &.report-button:hover {
    background-color: ${({ theme }) => theme.colors.error[100]};
    color: ${({ theme }) => theme.colors.error[600]};
  }
`

// Individual Player Card Component
const PlayerCard = React.memo(function PlayerCard({
  player,
  isTurn = false,
  isSelf = false,
  isOwner = false,
  currentTurnPlayerId,
  onAddFriend,
  onReportPlayer,
  className = '',
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Determine player status text
  const getStatusText = () => {
    if (isOwner) return '방장'
    if (isTurn) return '발언 중'
    return '대기 중'
  }
  
  // Handle friend add
  const handleAddFriend = (e) => {
    e.stopPropagation()
    onAddFriend?.(player)
  }
  
  // Handle report
  const handleReport = (e) => {
    e.stopPropagation()
    onReportPlayer?.(player)
  }
  
  return (
    <CardContainer
      className={className}
      $isTurn={isTurn}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      {...props}
    >
      <CardContent>
        <TopSection>
          <AvatarContainer>
            <UserAvatar
              userId={player.id}
              nickname={player.nickname}
              avatarUrl={player.avatarUrl}
              size="small"
            />
            <StatusDot $isOnline={player.isOnline !== false} />
          </AvatarContainer>
          
          <PlayerInfo>
            <PlayerNickname>
              {player.nickname}
            </PlayerNickname>
            {player.role && (
              <RoleBadge $role={player.role}>
                {player.role === 'liar' ? '라이어' : '시민'}
              </RoleBadge>
            )}
          </PlayerInfo>
        </TopSection>
        
        <BottomSection>
          <StatusText>
            {isOwner && <span className="crown-icon">👑</span>}
            {getStatusText()}
          </StatusText>
          
          <ActionButtons>
            {!isSelf && (
              <ActionButton
                onClick={handleAddFriend}
                aria-label={`친구 추가: ${player.nickname}`}
                title="친구 추가"
              >
                <PersonAddIcon />
              </ActionButton>
            )}
            <ActionButton
              className="report-button"
              onClick={handleReport}
              aria-label={`신고: ${player.nickname}`}
              title="신고"
            >
              <ReportIcon />
            </ActionButton>
          </ActionButtons>
        </BottomSection>
      </CardContent>
    </CardContainer>
  )
})

// Container variants for staggered animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Individual card variants
const cardVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      duration: 0.2
    }
  }
}

const PlayersPanel = React.memo(function PlayersPanel({
  players,
  effectiveCurrentTurnPlayerId,
  currentUserNickname,
  onAddFriend,
  onReportPlayer,
}) {
  // Determine if player is room owner (first player in array)
  const isPlayerOwner = (player, index) => {
    return index === 0 || player.isOwner || player.role === 'owner'
  }
  
  // Handle empty state
  if (!players || players.length === 0) {
    return (
      <PlayersPanelContainer>
        <EmptyState>
          <div className="empty-icon">👥</div>
          <Typography variant="body2" color="text.secondary">
            플레이어를 불러오는 중...
          </Typography>
        </EmptyState>
      </PlayersPanelContainer>
    )
  }

  return (
    <PlayersPanelContainer>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <PlayersGrid>
          <AnimatePresence mode="popLayout">
            {players.map((player, index) => {
              const isTurn = effectiveCurrentTurnPlayerId === player.id
              const isSelf = currentUserNickname && player.nickname === currentUserNickname
              const isOwner = isPlayerOwner(player, index)
              
              return (
                <motion.div
                  key={player.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  layoutId={`player-${player.id}`}
                  style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  <PlayerCard
                    player={player}
                    isTurn={isTurn}
                    isSelf={isSelf}
                    isOwner={isOwner}
                    currentTurnPlayerId={effectiveCurrentTurnPlayerId}
                    onAddFriend={onAddFriend}
                    onReportPlayer={onReportPlayer}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </PlayersGrid>
      </motion.div>
    </PlayersPanelContainer>
  )
})

PlayersPanel.displayName = 'PlayersPanel'
export default PlayersPanel
