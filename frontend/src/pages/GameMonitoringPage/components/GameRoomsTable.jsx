import React from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import GameRoomRow from './GameRoomRow'

const GameRoomsTable = React.memo(function GameRoomsTable({
  gameRooms,
  getStatusColor,
  getStatusText
}) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        실시간 게임방 목록
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>방 번호</TableCell>
              <TableCell>방 이름</TableCell>
              <TableCell>참가자</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>비밀번호</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gameRooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  현재 진행중인 게임방이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              gameRooms.map((room) => (
                <GameRoomRow
                  key={room.gameNumber}
                  room={room}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
})

GameRoomsTable.displayName = 'GameRoomsTable'
export default GameRoomsTable