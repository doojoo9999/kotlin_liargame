import {useState} from 'react'
import {Box, Container} from '@mui/material'
import PlayerProfile from './components/PlayerProfile'
import GameInfoDisplay from './components/GameInfoDisplay'

/**
 * Main App component that serves as the root of the application.
 * It contains the game layout with player profiles and central game information display.
 */
function App() {
  // Dummy player data
  const [players] = useState([
    { id: 1, nickname: 'Player 1', avatarUrl: 'https://via.placeholder.com/60/FF5733/FFFFFF?text=P1' },
    { id: 2, nickname: 'Player 2', avatarUrl: 'https://via.placeholder.com/60/33FF57/FFFFFF?text=P2' },
    { id: 3, nickname: 'Player 3', avatarUrl: 'https://via.placeholder.com/60/3357FF/FFFFFF?text=P3' },
    { id: 4, nickname: 'Player 4', avatarUrl: 'https://via.placeholder.com/60/F333FF/FFFFFF?text=P4' },
  ]);

  // Current turn player ID (dummy data)
  const [currentTurnPlayerId] = useState(2);

  // Game information text (dummy data)
  const [gameInfoText] = useState({
    round: 1,
    topic: 'Animals',
    status: 'Waiting for players to choose a word...'
  });

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}>
        {/* Top left player */}
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <PlayerProfile 
            player={players[0]} 
            isCurrentTurn={players[0].id === currentTurnPlayerId} 
          />
        </Box>

        {/* Top right player */}
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <PlayerProfile 
            player={players[1]} 
            isCurrentTurn={players[1].id === currentTurnPlayerId} 
          />
        </Box>

        {/* Bottom left player */}
        <Box sx={{ position: 'absolute', bottom: 16, left: 16 }}>
          <PlayerProfile 
            player={players[2]} 
            isCurrentTurn={players[2].id === currentTurnPlayerId} 
          />
        </Box>

        {/* Bottom right player */}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
          <PlayerProfile 
            player={players[3]} 
            isCurrentTurn={players[3].id === currentTurnPlayerId} 
          />
        </Box>

        {/* Center game info display */}
        <Box sx={{ width: '60%', height: '60%' }}>
          <GameInfoDisplay gameInfo={gameInfoText} />
        </Box>
      </Box>
    </Container>
  )
}

export default App