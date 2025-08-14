import React from 'react'
import { Box } from '@mui/material'
import AnimatedPlayerProfile from '../../../components/AnimatedPlayerProfile'
import PlayerSpeechBubble from '../../../components/PlayerSpeechBubble'

const AroundScreenPlayers = React.memo(function AroundScreenPlayers({
  playerPositions,
  effectiveCurrentTurnPlayerId,
  speechBubbles,
}) {
  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          zIndex: 1,
        }}
      >
        {playerPositions.top.map((player) => (
          <Box key={player.id} sx={{ position: 'relative' }}>
            <AnimatedPlayerProfile
              player={player}
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
              playerRole={player.role}
            />
            {speechBubbles[player.id] && (
              <PlayerSpeechBubble message={speechBubbles[player.id]} position="bottom" />
            )}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          right: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1,
        }}
      >
        {playerPositions.right.map((player) => (
          <Box key={player.id} sx={{ position: 'relative' }}>
            <AnimatedPlayerProfile
              player={player}
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
              playerRole={player.role}
            />
            {speechBubbles[player.id] && (
              <PlayerSpeechBubble message={speechBubbles[player.id]} position="left" />
            )}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 2,
          zIndex: 1,
        }}
      >
        {playerPositions.bottom.map((player) => (
          <Box key={player.id} sx={{ position: 'relative' }}>
            <AnimatedPlayerProfile
              player={player}
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
              playerRole={player.role}
            />
            {speechBubbles[player.id] && (
              <PlayerSpeechBubble message={speechBubbles[player.id]} position="top" />
            )}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          position: 'absolute',
          left: 20,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1,
        }}
      >
        {playerPositions.left.map((player) => (
          <Box key={player.id} sx={{ position: 'relative' }}>
            <AnimatedPlayerProfile
              player={player}
              isCurrentTurn={effectiveCurrentTurnPlayerId === player.id}
              playerRole={player.role}
            />
            {speechBubbles[player.id] && (
              <PlayerSpeechBubble message={speechBubbles[player.id]} position="right" />
            )}
          </Box>
        ))}
      </Box>
    </>
  )
})

AroundScreenPlayers.displayName = 'AroundScreenPlayers'
export default AroundScreenPlayers
