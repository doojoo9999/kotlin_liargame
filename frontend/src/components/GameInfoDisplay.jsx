import {Box, Paper, Typography} from '@mui/material'
import PropTypes from 'prop-types'

/**
 * GameInfoDisplay component shows the central game information.
 * It displays the current round, topic, and game status.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.gameInfo - Game information object containing round, topic, and status
 */
function GameInfoDisplay({ gameInfo }) {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Round {gameInfo.round}
        </Typography>
        
        <Typography variant="h2" component="h2" gutterBottom sx={{ fontWeight: 'bold', my: 4 }}>
          {gameInfo.topic}
        </Typography>
        
        <Typography variant="h5" component="div" color="text.secondary" sx={{ mt: 2 }}>
          {gameInfo.status}
        </Typography>
      </Box>
    </Paper>
  )
}

GameInfoDisplay.propTypes = {
  gameInfo: PropTypes.shape({
    round: PropTypes.number.isRequired,
    topic: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired
  }).isRequired
}

export default GameInfoDisplay