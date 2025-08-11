import {Card, CardContent, Typography} from '@mui/material'
import PropTypes from 'prop-types'
import UserAvatar from './UserAvatar'

function PlayerProfile({ player, isCurrentTurn = false }) {
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
        <UserAvatar
          userId={player.id}
          nickname={player.nickname}
          avatarUrl={player.avatarUrl}
          size="large"
          isCurrentTurn={isCurrentTurn}
          additionalSx={{
            margin: '0 auto 8px auto'
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
    avatarUrl: PropTypes.string
  }).isRequired,
  isCurrentTurn: PropTypes.bool
}


export default PlayerProfile