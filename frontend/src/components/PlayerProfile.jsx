import {Card, CardContent, Typography} from '@components/ui'
import PropTypes from 'prop-types'
import UserAvatar from './UserAvatar'

function PlayerProfile({ player, isCurrentTurn = false }) {
  return (
    <Card 
      style={{ 
        width: 120, 
        textAlign: 'center',
        border: isCurrentTurn ? '3px solid #ff9800' : 'none',
        boxShadow: isCurrentTurn ? '0 12px 24px rgba(0,0,0,0.15)' : '0 4px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        backgroundColor: isCurrentTurn ? 'rgba(255, 152, 0, 0.1)' : 'white'
      }}
    >
      <CardContent style={{ padding: 16 }}>
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
        <Typography variant="subtitle1" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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