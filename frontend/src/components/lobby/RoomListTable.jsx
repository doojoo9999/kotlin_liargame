import React, {memo} from 'react'
import PropTypes from 'prop-types'
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
    Typography
} from '@components/ui'
import {Lock as LockIcon, LogIn as LoginIcon, Play as PlayIcon, Users as PeopleIcon} from 'lucide-react'
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
    <Paper style={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
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
                <TableCell colSpan={7} align="center" style={{ padding: '32px 16px' }}>
                  <CircularProgress />
                  <Typography variant="body2" style={{ color: '#666666', marginTop: '8px' }}>
                    방 목록을 불러오는 중...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : error?.rooms ? (
              <TableRow>
                <TableCell colSpan={7} align="center" style={{ padding: '32px 16px' }}>
                  <Typography variant="body1" style={{ color: '#f44336', marginBottom: '16px' }}>
                    {error.rooms}
                  </Typography>
                  <Button variant="outlined" onClick={onRefreshRooms}>
                    다시 시도
                  </Button>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(roomList) ? (
              <TableRow>
                <TableCell colSpan={7} align="center" style={{ padding: '32px 16px' }}>
                  <Typography variant="body1" style={{ color: '#f44336', marginBottom: '16px' }}>
                    데이터 형식 오류가 발생했습니다. 페이지를 새로고침해주세요.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => window.location.reload()}
                    style={{ marginTop: '8px' }}
                  >
                    새로고침
                  </Button>
                </TableCell>
              </TableRow>
            ) : roomList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" style={{ padding: '32px 16px' }}>
                  <Typography variant="body1" style={{ color: '#666666' }}>
                    생성된 방이 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              roomList.map((room) => (
                <TableRow key={room.gameNumber}>
                  <TableCell>
                    <Typography variant="subtitle1" style={{ fontWeight: 'medium' }}>
                      {room.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{room.host}</TableCell>
                  <TableCell align="center">
                    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <PeopleIcon size={16} />
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
                      <LockIcon size={16} title="비밀방" style={{ color: '#757575' }} />
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

RoomListTable.propTypes = {
  roomList: PropTypes.arrayOf(
    PropTypes.shape({
      gameNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      host: PropTypes.string,
      playerCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currentPlayers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      maxPlayers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      subjects: PropTypes.arrayOf(PropTypes.string),
      subject: PropTypes.string,
      state: PropTypes.string,
      hasPassword: PropTypes.bool,
    })
  ),
  loading: PropTypes.shape({
    rooms: PropTypes.bool,
  }),
  error: PropTypes.shape({
    rooms: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }),
  onJoinRoom: PropTypes.func.isRequired,
  onRefreshRooms: PropTypes.func.isRequired,
}

RoomListTable.defaultProps = {
  roomList: [],
  loading: { rooms: false },
  error: { rooms: null },
}

export default memo(RoomListTable)