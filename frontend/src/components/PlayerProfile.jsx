import {Avatar, Card, CardContent, Typography} from '@mui/material'
import PropTypes from 'prop-types'

// Generate consistent color based on nickname
function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function PlayerProfile({ player, isCurrentTurn = false }) {
  const avatarProps = {
    alt: player.nickname,
    sx: { 
      width: 60, 
      height: 60, 
      margin: '0 auto 8px auto',
      border: isCurrentTurn ? '2px solid #ff9800' : 'none',
      bgcolor: stringToColor(player.nickname || 'User'),
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold'
    }
  };

  // If avatarUrl exists, try to use it, otherwise use local avatar
  if (player.avatarUrl) {
    avatarProps.src = player.avatarUrl;
  }

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
        <Avatar {...avatarProps}>
          {(player.nickname || 'U').charAt(0).toUpperCase()}
        </Avatar>
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
    avatarUrl: PropTypes.string
  }).isRequired,
  isCurrentTurn: PropTypes.bool
}


export default PlayerProfile