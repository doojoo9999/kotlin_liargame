import React from 'react'
import { Box, Button, Chip, Typography } from '@mui/material'
import { ExitToApp as ExitIcon, Help as HelpIcon, People as PeopleIcon } from '@mui/icons-material'

const HeaderBar = React.memo(function HeaderBar({
  currentRoom,
  isMobile,
  roomStateInfo,
  playersCount,
  maxPlayers,
  onOpenTutorial,
  onOpenLeaveDialog,
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, minWidth: 200 }}>
        {currentRoom.title || `${currentRoom.gameName || '제목 없음'} #${currentRoom.gameNumber}`}
        {currentRoom.subjects && currentRoom.subjects.length > 0 && ` - [${currentRoom.subjects.join(', ')}]`}
        {!currentRoom.subjects && currentRoom.subject && ` - [${currentRoom.subject?.name || currentRoom.subject?.content || '주제 없음'}]`}
      </Typography>

      <Chip
        icon={roomStateInfo.icon}
        label={roomStateInfo.text}
        color={roomStateInfo.color}
        variant="outlined"
        size={isMobile ? 'small' : 'medium'}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PeopleIcon />
        <Typography variant="body2">
          {playersCount}/{maxPlayers}
        </Typography>
      </Box>

      <Button
        variant="outlined"
        startIcon={<HelpIcon />}
        onClick={onOpenTutorial}
        size={isMobile ? 'small' : 'medium'}
      >
        도움말
      </Button>

      <Button
        color="error"
        variant="outlined"
        startIcon={<ExitIcon />}
        onClick={onOpenLeaveDialog}
        size={isMobile ? 'small' : 'medium'}
      >
        나가기
      </Button>
    </Box>
  )
})

HeaderBar.displayName = 'HeaderBar'
export default HeaderBar
