import React from 'react'
import {Box, Button, Typography} from '@mui/material'
import {
    Add as AddIcon,
    HelpOutline as HelpIcon,
    InfoOutlined as InfoIcon,
    Logout as LogoutIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material'

/**
 * LobbyHeader component that displays the header section of the lobby
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - Current user object
 * @param {Object} props.loading - Loading states object
 * @param {Function} props.onRefreshRooms - Function to refresh room list
 * @param {Function} props.onCreateRoom - Function to open create room dialog
 * @param {Function} props.onAddContent - Function to open add content dialog
 * @param {Function} props.onOpenHelp - Function to open help dialog
 * @param {Function} props.onOpenGameRules - Function to open game rules dialog
 * @param {Function} props.onLogout - Function to open logout dialog
 * @returns {JSX.Element} LobbyHeader component
 */
const LobbyHeader = ({
  currentUser,
  loading,
  onRefreshRooms,
  onCreateRoom,
  onAddContent,
  onOpenHelp,
  onOpenGameRules,
  onLogout
}) => {
  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          라이어 게임 로비
        </Typography>
        {currentUser && (
          <Typography variant="body2" color="text.secondary">
            환영합니다, {currentUser.nickname}님!
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefreshRooms}
          disabled={loading?.rooms}
        >
          새로고침
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateRoom}
        >
          방 만들기
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddContent}
        >
          주제/답안 추가
        </Button>
        <Button
          variant="outlined"
          startIcon={<HelpIcon />}
          onClick={onOpenHelp}
        >
          도움말
        </Button>
        <Button
          variant="outlined"
          startIcon={<InfoIcon />}
          onClick={onOpenGameRules}
        >
          게임 방법
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
        >
          로그아웃
        </Button>
      </Box>
    </Box>
  )
}

export default LobbyHeader