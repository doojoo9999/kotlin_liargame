import React from 'react'
import { Box, Chip, IconButton, Typography } from '@mui/material'
import { PersonAdd as PersonAddIcon, Report as ReportIcon } from '@mui/icons-material'
import UserAvatar from '../../../components/UserAvatar'

const PlayersPanel = React.memo(function PlayersPanel({
  players,
  effectiveCurrentTurnPlayerId,
  currentUserNickname,
  onAddFriend,
  onReportPlayer,
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {players.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            플레이어를 불러오는 중...
          </Typography>
        </Box>
      ) : (
        players.map((player) => {
          const isTurn = effectiveCurrentTurnPlayerId === player.id
          const isSelf = currentUserNickname && player.nickname === currentUserNickname
          return (
            <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: '0 0 33%', minWidth: 0 }}>
                <Chip
                  avatar={
                    <UserAvatar
                      userId={player.id}
                      nickname={player.nickname}
                      avatarUrl={player.avatarUrl}
                      size="small"
                    />
                  }
                  label={player.nickname}
                  size="small"
                  variant={isTurn ? 'filled' : 'outlined'}
                  color={isTurn ? 'warning' : 'default'}
                  sx={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    px: 0.5,
                    '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                  }}
                />
              </Box>

              <Box sx={{ flex: '1 1 67%', display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                {!isSelf && (
                  <IconButton size="small" aria-label={`친구 추가: ${player.nickname}`} onClick={() => onAddFriend(player)}>
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" aria-label={`신고: ${player.nickname}`} onClick={() => onReportPlayer(player)}>
                  <ReportIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )
        })
      )}
    </Box>
  )
})

PlayersPanel.displayName = 'PlayersPanel'
export default PlayersPanel
