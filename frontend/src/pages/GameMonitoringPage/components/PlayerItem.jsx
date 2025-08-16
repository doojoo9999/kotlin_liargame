import React from 'react'
import {ListItem, ListItemText} from '../../../components/ui'

const PlayerItem = React.memo(function PlayerItem({ player }) {
  return (
    <ListItem>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginRight: '16px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#667eea',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        justifyContent: 'center'
      }}>
        {player.nickname?.charAt(0) || 'U'}
      </div>
      <ListItemText
        primary={player.nickname || '익명'}
        secondary={`ID: ${player.id || 'N/A'} | 상태: ${player.status || '로비'}`}
      />
    </ListItem>
  )
})

PlayerItem.displayName = 'PlayerItem'
export default PlayerItem