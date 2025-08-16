import React from 'react'
import {Alert, Box, Chip, Typography} from '../../../components/ui'
import {AlertCircle as ErrorIcon, CheckCircle as CheckCircleIcon, Wifi as WifiIcon} from 'lucide-react'

const ConnectionStatus = React.memo(function ConnectionStatus({ 
  isConnected, 
  connectionError 
}) {
  if (connectionError) {
    return (
      <Alert severity="error" style={{ marginBottom: '24px' }}>
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ErrorIcon size={16} />
          <Typography variant="body2">
            {connectionError}
          </Typography>
        </Box>
      </Alert>
    )
  }

  return (
    <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <Chip
        icon={isConnected ? <CheckCircleIcon size={16} /> : <WifiIcon size={16} />}
        label={isConnected ? '실시간 연결됨' : '연결 중...'}
        color={isConnected ? 'success' : 'warning'}
        size="small"
        variant="outlined"
      />
      <Typography variant="caption" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
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