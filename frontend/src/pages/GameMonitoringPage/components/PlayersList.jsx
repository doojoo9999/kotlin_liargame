import React from 'react'
import {Divider, List, ListItem, ListItemText, Paper, Typography} from '../../../components/ui'
import PlayerItem from './PlayerItem'

const PlayersList = React.memo(function PlayersList({ players }) {
  return (
    <Paper style={{ padding: '24px' }}>
      <Typography variant="h6" style={{ marginBottom: '16px' }}>
        접속 중인 플레이어
      </Typography>
      <Divider style={{ marginBottom: '16px' }} />
      <List style={{ maxHeight: '400px', overflow: 'auto' }}>
        {players.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="접속 중인 플레이어가 없습니다."
              style={{ textAlign: 'center' }}
            />
          </ListItem>
        ) : (
          players.map((player, index) => (
            <PlayerItem 
              key={player.id || index}
              player={player} 
              index={index}
            />
          ))
        )}
      </List>
    </Paper>
  )
})

PlayersList.displayName = 'PlayersList'
export default PlayersList