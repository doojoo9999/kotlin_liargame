import React from 'react'
import {Box} from '@components/ui'
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
        $position="absolute"
        $top="20px"
        $left="50%"
        style={{ transform: 'translateX(-50%)' }}
        $display="flex"
        $gap="16px"
        $zIndex="1"
      >
        {playerPositions.top.map((player) => (
          <Box key={player.id} $position="relative">
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
        $position="absolute"
        $right="20px"
        $top="50%"
        style={{ transform: 'translateY(-50%)' }}
        $display="flex"
        $flexDirection="column"
        $gap="16px"
        $zIndex="1"
      >
        {playerPositions.right.map((player) => (
          <Box key={player.id} $position="relative">
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
        $position="absolute"
        $bottom="20px"
        $left="50%"
        style={{ transform: 'translateX(-50%)' }}
        $display="flex"
        $gap="16px"
        $zIndex="1"
      >
        {playerPositions.bottom.map((player) => (
          <Box key={player.id} $position="relative">
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
        $position="absolute"
        $left="20px"
        $top="50%"
        style={{ transform: 'translateY(-50%)' }}
        $display="flex"
        $flexDirection="column"
        $gap="16px"
        $zIndex="1"
      >
        {playerPositions.left.map((player) => (
          <Box key={player.id} $position="relative">
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
