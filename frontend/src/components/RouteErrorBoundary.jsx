import React from 'react'
import {useRouteError} from 'react-router-dom'
import {Alert, Box, Button, Container, Typography} from '@mui/material'
import {Refresh as RefreshIcon} from '@mui/icons-material'

function RouteErrorBoundary() {
  const error = useRouteError()

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 3,
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          오류가 발생했습니다
        </Typography>
        
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: 2 
          }}
        >
          {error?.data || error?.statusText || error?.message || '알 수 없는 오류가 발생했습니다.'}
        </Alert>

        <Typography variant="body1" color="text.secondary">
          {error?.status && `오류 코드: ${error.status}`}
        </Typography>

        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRetry}
          size="large"
          sx={{
            mt: 2,
            px: 4,
            py: 1.5
          }}
        >
          다시 시도
        </Button>
      </Box>
    </Container>
  )
}

export default RouteErrorBoundary