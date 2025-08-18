import React from 'react'
import {useRouteError} from 'react-router-dom'
import {Alert, Box, Button, Typography} from '../components/ui'
import {RefreshCw as RefreshIcon} from 'lucide-react'

function RouteErrorBoundary() {
  const error = useRouteError()

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <Box style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <Box style={{ 
        padding: '32px', 
        borderRadius: '16px', 
        backgroundColor: 'white', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', 
        width: '100%' 
      }}>
        <Box $display="flex" $flexDirection="column" $alignItems="center" $justifyContent="center" $height="50vh" $gap="24px" style={{ textAlign: 'center' }}>
          <Typography variant="h4" color="#f44336" style={{ marginBottom: '16px', fontWeight: 'bold' }}>
            오류가 발생했습니다
          </Typography>
          
          <Alert severity="error" style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}>
            {error?.data || error?.statusText || error?.message || '알 수 없는 오류가 발생했습니다.'}
          </Alert>

          {error?.status && (
            <Typography variant="body1" color="#666" style={{ marginBottom: '16px' }}>
              오류 코드: {error.status}
            </Typography>
          )}

          <Button
            variant="contained"
            startIcon={<RefreshIcon size={20} />}
            onClick={handleRetry}
            style={{ 
              marginTop: '16px',
              paddingLeft: '32px',
              paddingRight: '32px',
              paddingTop: '12px',
              paddingBottom: '12px',
              borderRadius: '8px'
            }}
          >
            다시 시도
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default RouteErrorBoundary