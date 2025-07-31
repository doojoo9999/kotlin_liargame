import {Avatar, Card, CardContent, Typography} from '@mui/material'
import PropTypes from 'prop-types'

/**
 * PlayerProfile component displays a player's avatar and nickname.
 * It highlights the current player's turn with a visual indicator.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.player - Player data object containing id, nickname, and avatarUrl
 * @param {boolean} props.isCurrentTurn - Whether it's this player's turn
 */
function PlayerProfile({ player, isCurrentTurn }) {
  return (
    <Card 
      sx={{ 
        width: 120, 
        textAlign: 'center',
        border: isCurrentTurn ? '3px solid #ff9800' : 'none',
        boxShadow: isCurrentTurn ? 8 : 2,
        transition: 'all 0.3s ease',
        backgroundColor: isCurrentTurn ? 'rgba(255, 152, 0, 0.1)' : 'white'
      }}
    >
      <CardContent sx={{ padding: 2 }}>
        <Avatar 
          src={player.avatarUrl} 
          alt={player.nickname}
          sx={{ 
            width: 60, 
            height: 60, 
            margin: '0 auto 8px auto',
            border: isCurrentTurn ? '2px solid #ff9800' : 'none'
          }}
        />
        <Typography variant="subtitle1" component="div" noWrap>
          {player.nickname}
        </Typography>
      </CardContent>
    </Card>
  )
}

PlayerProfile.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nickname: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string.isRequired
  }).isRequired,
  isCurrentTurn: PropTypes.bool
}

PlayerProfile.defaultProps = {
  isCurrentTurn: false
}

export default PlayerProfile