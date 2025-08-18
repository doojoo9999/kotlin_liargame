// Modernized PlayersPanel component
// CSS Grid layout with player cards and staggered animations

import React, {useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Box, Typography} from '../../../components/ui'
import {UserPlus as PersonAddIcon, Flag as ReportIcon} from 'lucide-react'
import UserAvatar from '../../../components/UserAvatar'
import {getPlayersPanelStyles, getResponsiveStyles} from './PlayersPanel.styles'

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
  
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  
  const isCurrentTurn = currentTurnPlayerId === player.id
  
  return (
    <motion.div
      className={className}
      style={getPlayersPanelStyles().cardContainer(isCurrentTurn)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -4 }}
      whileTap={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      <div style={getPlayersPanelStyles().cardContent}>
        {/* Top Section */}
        <div style={getPlayersPanelStyles().topSection}>
          <div style={getPlayersPanelStyles().avatarContainer}>
            <UserAvatar
              user={player}
              size={isSelf ? 'large' : 'medium'}
              showStatus={true}
              isOnline={player.status === 'ONLINE'}
            />
            <div style={getPlayersPanelStyles().statusDot(player.status === 'ONLINE')} />
          </div>
          
          <div style={getPlayersPanelStyles().playerInfo}>
            <div style={getPlayersPanelStyles().playerNickname}>
              {player.nickname}
              {isOwner && ' 👑'}
            </div>
            
            {player.role && (
              <div style={getPlayersPanelStyles().roleBadge(player.role.toLowerCase())}>
                {player.role === 'LIAR' ? '라이어' : '시민'}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Section */}
        <div style={getPlayersPanelStyles().bottomSection}>
          <div style={getPlayersPanelStyles().statusText(player.status)}>
            {player.status === 'ONLINE' ? '🟢 온라인' : '⚫ 오프라인'}
          </div>
          
          <div style={getPlayersPanelStyles().actionButtons}>
            {onAddFriend && (
              <button
                style={getPlayersPanelStyles().actionButton()}
                onClick={() => onAddFriend(player.id)}
                title="친구 추가"
              >
                <PersonAddIcon size={14} />
              </button>
            )}
            
            {onReportPlayer && (
              <button
                style={getPlayersPanelStyles().actionButton('danger')}
                onClick={() => onReportPlayer(player.id)}
                title="신고하기"
                className="report-button"
              >
                <ReportIcon size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// Main PlayersPanel Component
const PlayersPanel = ({
  players = [],
  currentTurnPlayerId,
  onAddFriend,
  onReportPlayer,
  className = '',
  ...props
}) => {
  const styles = getPlayersPanelStyles()
  const responsiveStyles = getResponsiveStyles()
  
  if (!players || players.length === 0) {
    return (
      <Box
        style={{
          ...styles.emptyState,
          ...responsiveStyles.emptyState
        }}
        className={className}
        {...props}
      >
        <div className="empty-icon">👥</div>
        <Typography variant="h6" color="textSecondary">
          플레이어가 없습니다
        </Typography>
        <Typography variant="body2" color="textSecondary">
          게임을 시작하면 플레이어들이 여기에 표시됩니다
        </Typography>
      </Box>
    )
  }
  
  return (
    <Box
      style={styles.container}
      className={className}
      {...props}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        플레이어 ({players.length})
      </Typography>
      
      <div style={{
        ...styles.grid,
        ...responsiveStyles.grid
      }}>
        <AnimatePresence>
          {players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              isTurn={currentTurnPlayerId === player.id}
              currentTurnPlayerId={currentTurnPlayerId}
              onAddFriend={onAddFriend}
              onReportPlayer={onReportPlayer}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </Box>
  )
}

export default PlayersPanel
