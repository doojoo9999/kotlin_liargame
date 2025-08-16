import {Box, Paper, Typography} from '@components/ui'
import PropTypes from 'prop-types'

function GameInfoDisplay({ gameInfo }) {
  // Handle undefined gameInfo with fallback values
  if (!gameInfo) {
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
          <Typography variant="h6" color="text.secondary">
            게임 정보 로딩 중...
          </Typography>
        </Box>
      </Paper>
    )
  }

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
          Round {gameInfo.round || 1}
        </Typography>
        
        <Typography variant="h2" component="h2" gutterBottom sx={{ fontWeight: 'bold', my: 4 }}>
          {gameInfo.topic || '주제 없음'}
        </Typography>
        
        <Typography variant="h5" component="div" color="text.secondary" sx={{ mt: 2 }}>
          {gameInfo.status || '대기 중'}
        </Typography>
      </Box>
    </Paper>
  )
}

GameInfoDisplay.propTypes = {
  gameInfo: PropTypes.shape({
    round: PropTypes.number,
    topic: PropTypes.string,
    status: PropTypes.string
  })
}

export default GameInfoDisplay