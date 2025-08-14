import React from 'react'
import { Divider, List, ListItem, ListItemText, Paper, Typography } from '@mui/material'
import PlayerItem from './PlayerItem'

const PlayersList = React.memo(function PlayersList({ players }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        접속 중인 플레이어
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {players.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="접속 중인 플레이어가 없습니다."
              sx={{ textAlign: 'center' }}
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