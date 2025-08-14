import React from 'react'
import { Alert, Box, Chip, Typography } from '@mui/material'
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, Wifi as WifiIcon } from '@mui/icons-material'

const ConnectionStatus = React.memo(function ConnectionStatus({ 
  isConnected, 
  connectionError 
}) {
  if (connectionError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon />
          <Typography variant="body2">
            {connectionError}
          </Typography>
        </Box>
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Chip
        icon={isConnected ? <CheckCircleIcon /> : <WifiIcon />}
        label={isConnected ? '실시간 연결됨' : '연결 중...'}
        color={isConnected ? 'success' : 'warning'}
        size="small"
        variant="outlined"
      />
      <Typography variant="caption" color="text.secondary">
        {isConnected 
          ? '실시간 업데이트가 활성화되어 있습니다' 
          : 'WebSocket 연결을 시도하고 있습니다'
        }
      </Typography>
    </Box>
  )
})

ConnectionStatus.displayName = 'ConnectionStatus'
export default ConnectionStatus