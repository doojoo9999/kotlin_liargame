import React from 'react'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material'
import {Lock as LockIcon, Login as LoginIcon, People as PeopleIcon, PlayArrow as PlayIcon} from '@mui/icons-material'
import {getRoomStateColor, getRoomStateText} from '../../utils/roomUtils'

/**
 * RoomListTable component that displays the list of available rooms
 * @param {Object} props - Component props
 * @param {Array} props.roomList - Array of room objects
 * @param {Object} props.loading - Loading states object
 * @param {Object} props.error - Error states object
 * @param {Function} props.onJoinRoom - Function to handle room joining
 * @param {Function} props.onRefreshRooms - Function to refresh room list
 * @returns {JSX.Element} RoomListTable component
 */
const RoomListTable = ({
  roomList,
  loading,
  error,
  onJoinRoom,
  onRefreshRooms
}) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>방 제목</TableCell>
              <TableCell>방장</TableCell>
              <TableCell align="center">인원</TableCell>
              <TableCell align="center">주제</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">비밀방</TableCell>
              <TableCell align="center">입장</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading?.rooms ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    방 목록을 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error?.rooms ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                    {error.rooms}
                  </Typography>
                  <Button variant="outlined" onClick={onRefreshRooms}>
                    다시 시도
                  </Button>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(roomList) ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="error" sx={{ mb: 2 }}>
                    데이터 형식 오류가 발생했습니다. 페이지를 새로고침해주세요.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => window.location.reload()} 
                    sx={{ mt: 1 }}
                  >
                    새로고침
                  </Button>
                </TableCell>
              </TableRow>
            ) : roomList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    생성된 방이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              roomList.map((room) => (
                <TableRow key={room.gameNumber} hover>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {room.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{room.host}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <PeopleIcon fontSize="small" />
                      {room.playerCount || room.currentPlayers || 0}/{room.maxPlayers}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {room.subjects && room.subjects.length > 1 ? (
                      <Chip 
                        label={`${room.subjects[0]} 외 ${room.subjects.length - 1}개 주제`} 
                        size="small" 
                        variant="outlined" 
                      />
                    ) : (
                      <Chip 
                        label={room.subjects && room.subjects.length > 0 ? room.subjects[0] : room.subject} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getRoomStateText(room.state)}
                      color={getRoomStateColor(room.state)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {room.hasPassword && (
                      <Tooltip title="비밀방">
                        <LockIcon fontSize="small" color="action" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={room.state === 'WAITING' ? <LoginIcon /> : <PlayIcon />}
                      onClick={() => onJoinRoom(room)}
                      disabled={
                          room.state === 'FINISHED' ||
                          room.state === 'ENDED' ||
                          (parseInt(room.currentPlayers || room.playerCount || 0) >= parseInt(room.maxPlayers || 0))
                    }
                    >
                      {room.state === 'WAITING' ? '입장' : '관전'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default RoomListTable