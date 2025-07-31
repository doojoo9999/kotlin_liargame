import {useEffect, useState} from 'react'
import {Box, Container, Paper, Slider, Typography} from '@mui/material'
import PlayerProfile from './components/PlayerProfile'
import PlayerSpeechBubble from './components/PlayerSpeechBubble'
import ChatWindow from './components/ChatWindow'

/**
 * Main App component that serves as the root of the application.
 * It contains the game layout with player profiles distributed around the edges,
 * speech bubbles for game status messages, and a central chat window.
 */
function App() {
  // Dummy player data (expanded to 12 players)
  const allPlayers = [
    { id: 1, nickname: 'Player 1', avatarUrl: 'https://via.placeholder.com/60/FF5733/FFFFFF?text=P1' },
    { id: 2, nickname: 'Player 2', avatarUrl: 'https://via.placeholder.com/60/33FF57/FFFFFF?text=P2' },
    { id: 3, nickname: 'Player 3', avatarUrl: 'https://via.placeholder.com/60/3357FF/FFFFFF?text=P3' },
    { id: 4, nickname: 'Player 4', avatarUrl: 'https://via.placeholder.com/60/F333FF/FFFFFF?text=P4' },
    { id: 5, nickname: 'Player 5', avatarUrl: 'https://via.placeholder.com/60/33FFF5/FFFFFF?text=P5' },
    { id: 6, nickname: 'Player 6', avatarUrl: 'https://via.placeholder.com/60/FF33F5/FFFFFF?text=P6' },
    { id: 7, nickname: 'Player 7', avatarUrl: 'https://via.placeholder.com/60/F5FF33/FFFFFF?text=P7' },
    { id: 8, nickname: 'Player 8', avatarUrl: 'https://via.placeholder.com/60/33F5FF/FFFFFF?text=P8' },
    { id: 9, nickname: 'Player 9', avatarUrl: 'https://via.placeholder.com/60/FF3333/FFFFFF?text=P9' },
    { id: 10, nickname: 'Player 10', avatarUrl: 'https://via.placeholder.com/60/33FF33/FFFFFF?text=P10' },
    { id: 11, nickname: 'Player 11', avatarUrl: 'https://via.placeholder.com/60/3333FF/FFFFFF?text=P11' },
    { id: 12, nickname: 'Player 12', avatarUrl: 'https://via.placeholder.com/60/FFFF33/FFFFFF?text=P12' },
  ];
  
  // State for visible player count (for testing different player counts)
  const [visiblePlayerCount, setVisiblePlayerCount] = useState(12);
  
  // Visible players based on the count
  const players = allPlayers.slice(0, visiblePlayerCount);

  // Current turn player ID (dummy data)
  const [currentTurnPlayerId] = useState(2);
  
  /**
   * State to track active speech bubbles for each player.
   * The object keys are player IDs, and the values are the messages to display.
   * Example: { 1: "라이어입니다!", 3: "투표 완료!" }
   */
  const [speechBubbles, setSpeechBubbles] = useState({});
  
  /**
   * Demonstration effect that shows and hides speech bubbles randomly.
   * This simulates game events that would trigger speech bubbles in a real game.
   * In a production environment, these would be triggered by actual game events.
   */
  useEffect(() => {
    // Example game status messages that might appear in speech bubbles
    const messages = [
      "라이어입니다!",      // "You are the liar!"
      "시민입니다!",        // "You are a citizen!"
      "투표 완료!",         // "Vote complete!"
      "힌트: 주방용품",      // "Hint: Kitchen item"
      "당신이 이겼습니다!"   // "You won!"
    ];
    
    /**
     * Shows a speech bubble with a random message for a random player.
     * The bubble automatically disappears after 5 seconds.
     */
    const showRandomSpeechBubble = () => {
      // Select a random player and message
      const randomPlayerId = Math.floor(Math.random() * players.length) + 1;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      // Add the speech bubble to state
      setSpeechBubbles(prev => ({
        ...prev,
        [randomPlayerId]: randomMessage
      }));
      
      // Automatically remove the speech bubble after 5 seconds
      setTimeout(() => {
        setSpeechBubbles(prev => {
          const newState = {...prev};
          delete newState[randomPlayerId];
          return newState;
        });
      }, 5000);
    };
    
    // Show an initial speech bubble when the component mounts
    showRandomSpeechBubble();
    
    // Show additional speech bubbles at regular intervals
    const interval = setInterval(() => {
      showRandomSpeechBubble();
    }, 7000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [players.length]);

  /**
   * Calculates how many players should be placed on each side of the screen
   * based on the total number of players.
   * 
   * Distribution logic:
   * - For 12 players: 3 on each side (top, right, bottom, left)
   * - For 8-11 players: 2 on each side, plus remaining players distributed clockwise
   * - For 4-7 players: 1 on each side, plus remaining players distributed clockwise
   * - For 3 players: 1 on top, right, and bottom (none on left)
   * 
   * This ensures the layout is responsive to different player counts while
   * maintaining visual balance.
   * 
   * @param {number} count - Total number of players (3-12)
   * @returns {Object} Distribution object with top, right, bottom, left counts
   */
  const getPlayerDistribution = (count) => {
    // Default distribution for 12 players: 3 on each side
    let top = 3, right = 3, bottom = 3, left = 3;
    
    // Adjust distribution for fewer players
    if (count < 12) {
      // For 8-11 players: reduce from sides evenly
      if (count >= 8) {
        const remaining = count - 8;
        top = 2;
        right = 2;
        bottom = 2;
        left = 2;
        
        // Distribute remaining players clockwise (top → right → bottom → left)
        if (remaining >= 1) top++;
        if (remaining >= 2) right++;
        if (remaining >= 3) bottom++;
        if (remaining >= 4) left++;
      } 
      // For 4-7 players: 1-2 on each side
      else if (count >= 4) {
        const remaining = count - 4;
        top = 1;
        right = 1;
        bottom = 1;
        left = 1;
        
        // Distribute remaining players clockwise (top → right → bottom)
        if (remaining >= 1) top++;
        if (remaining >= 2) right++;
        if (remaining >= 3) bottom++;
      }
      // For 3 players: special case (1 on top, right, bottom)
      else if (count === 3) {
        top = 1;
        right = 1;
        bottom = 1;
        left = 0;
      }
    }
    
    return { top, right, bottom, left };
  };
  
  // Calculate player distribution based on the current number of players
  const { top, right, bottom, left } = getPlayerDistribution(players.length);
  
  /**
   * Determines the appropriate speech bubble position based on the player's position on the screen.
   * The speech bubble should point toward the player, so it appears on the opposite side.
   * 
   * @param {string} position - The player's position ('top', 'right', 'bottom', 'left')
   * @returns {string} The appropriate speech bubble position
   */
  const getSpeechBubblePosition = (position) => {
    if (position === 'top') return 'bottom';    // For players at the top, bubble points up from below
    if (position === 'right') return 'left';    // For players on the right, bubble points right from left
    if (position === 'bottom') return 'top';    // For players at the bottom, bubble points down from above
    if (position === 'left') return 'right';    // For players on the left, bubble points left from right
    return 'bottom';                            // Default fallback
  };
  
  /**
   * Renders a player profile with a speech bubble if one exists for that player.
   * The speech bubble position is determined based on the player's position on the screen.
   * 
   * @param {Object} player - The player object
   * @param {string} position - The player's position on the screen ('top', 'right', 'bottom', 'left')
   * @returns {JSX.Element} The rendered player profile with optional speech bubble
   */
  const renderPlayerProfile = (player, position) => {
    // Check if this player has an active speech bubble
    const hasSpeechBubble = speechBubbles[player.id] !== undefined;
    
    return (
      <Box key={player.id} sx={{ position: 'relative', margin: 1 }}>
        {/* Render the player profile */}
        <PlayerProfile 
          player={player} 
          isCurrentTurn={player.id === currentTurnPlayerId} 
        />
        
        {/* Render speech bubble if one exists for this player */}
        {hasSpeechBubble && (
          <PlayerSpeechBubble
            message={speechBubbles[player.id]}
            position={getSpeechBubblePosition(position)}
            show={true}
            onHide={() => {
              // Remove this player's speech bubble when it's hidden
              setSpeechBubbles(prev => {
                const newState = {...prev};
                delete newState[player.id];
                return newState;
              });
            }}
          />
        )}
      </Box>
    );
  };
  
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
        {/* 
          Top row players
          - Positioned at the top of the screen
          - Horizontally centered
          - Contains the first 'top' number of players from the distribution
        */}
        <Box sx={{ 
          position: 'absolute', 
          top: 16, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          {/* Render player profiles with 'top' position for speech bubbles */}
          {players.slice(0, top).map(player => renderPlayerProfile(player, 'top'))}
        </Box>
        
        {/* 
          Right column players
          - Positioned at the right side of the screen
          - Vertically centered
          - Contains the next 'right' number of players from the distribution
        */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          {/* Render player profiles with 'right' position for speech bubbles */}
          {players.slice(top, top + right).map(player => renderPlayerProfile(player, 'right'))}
        </Box>
        
        {/* 
          Bottom row players
          - Positioned at the bottom of the screen
          - Horizontally centered
          - Contains the next 'bottom' number of players from the distribution
        */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center' 
        }}>
          {/* Render player profiles with 'bottom' position for speech bubbles */}
          {players.slice(top + right, top + right + bottom).map(player => renderPlayerProfile(player, 'bottom'))}
        </Box>
        
        {/* 
          Left column players
          - Positioned at the left side of the screen
          - Vertically centered
          - Contains the remaining 'left' number of players from the distribution
        */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          bottom: 0, 
          left: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center' 
        }}>
          {/* Render player profiles with 'left' position for speech bubbles */}
          {players.slice(top + right + bottom, top + right + bottom + left).map(player => renderPlayerProfile(player, 'left'))}
        </Box>

        {/* 
          Center chat window
          - Positioned in the center of the screen
          - Takes up 60% of the available width and height
          - Focused on information delivery without visual effects
        */}
        <Box sx={{ width: '60%', height: '60%' }}>
          <ChatWindow />
        </Box>
        
        {/* Player count control (for testing) */}
        <Paper 
          elevation={3}
          sx={{ 
            position: 'absolute', 
            bottom: 16, 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: 300,
            padding: 2,
            zIndex: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 2
          }}
        >
          <Typography id="player-count-slider" gutterBottom>
            Player Count: {visiblePlayerCount}
          </Typography>
          <Slider
            value={visiblePlayerCount}
            onChange={(e, newValue) => setVisiblePlayerCount(newValue)}
            step={1}
            marks
            min={3}
            max={12}
            valueLabelDisplay="auto"
            aria-labelledby="player-count-slider"
          />
        </Paper>
      </Box>
    </Container>
  )
}

export default App