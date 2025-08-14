import React from 'react'
import { Chip, TableCell, TableRow } from '@mui/material'

const GameRoomRow = React.memo(function GameRoomRow({ 
  room, 
  getStatusColor, 
  getStatusText 
}) {
  return (
    <TableRow>
      <TableCell>{room.gameNumber}</TableCell>
      <TableCell>{room.gameName}</TableCell>
      <TableCell>
        {room.playerCount}/{room.maxPlayers}
      </TableCell>
      <TableCell>
        <Chip 
          label={getStatusText(room.status)}
          color={getStatusColor(room.status)}
          size="small"
        />
      </TableCell>
      <TableCell>
        {room.hasPassword ? '🔒' : '🔓'}
      </TableCell>
      <TableCell>
        {/* 강제 종료 기능은 현재 비활성화되어 있습니다 */}
        -
      </TableCell>
    </TableRow>
  )
})

GameRoomRow.displayName = 'GameRoomRow'
export default GameRoomRow