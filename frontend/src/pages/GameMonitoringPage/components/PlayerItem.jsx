import React from 'react'
import { Avatar, ListItem, ListItemAvatar, ListItemText } from '@mui/material'

const PlayerItem = React.memo(function PlayerItem({ player }) {
  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {player.nickname?.charAt(0) || 'U'}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={player.nickname || '익명'}
        secondary={`ID: ${player.id || 'N/A'} | 상태: ${player.status || '로비'}`}
      />
    </ListItem>
  )
})

PlayerItem.displayName = 'PlayerItem'
export default PlayerItem