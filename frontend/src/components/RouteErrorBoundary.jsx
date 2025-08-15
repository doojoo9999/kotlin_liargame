import React from 'react'
import {useRouteError} from 'react-router-dom'
import styled from 'styled-components'
import {Alert, Box, Button, Typography} from '../components/ui'
import {RefreshCw as RefreshIcon} from 'lucide-react'

// Styled components for game-style design
const RouteErrorContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
`

const RouteErrorContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 24px;
  text-align: center;
`

const RouteErrorCard = styled.div`
  padding: 32px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
`

function RouteErrorBoundary() {
  const error = useRouteError()

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <RouteErrorContainer>
      <RouteErrorCard>
        <RouteErrorContent>
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
        </RouteErrorContent>
      </RouteErrorCard>
    </RouteErrorContainer>
  )
}

export default RouteErrorBoundary