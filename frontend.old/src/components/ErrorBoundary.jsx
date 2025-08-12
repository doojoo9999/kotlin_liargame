import React from 'react'
import {Alert, Box, Button, Paper, Typography} from '@mui/material'
import {ErrorOutline as ErrorIcon, Refresh as RefreshIcon} from '@mui/icons-material'


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check for WebSocket-related errors and handle them specifically
    if (error.message.includes('WebSocket') || error.message.includes('STOMP') || 
        error.message.includes('Socket.IO') || error.message.includes('websocket')) {
      console.error('WebSocket-related error detected:', error)
      
      // Dispatch custom event for WebSocket errors
      window.dispatchEvent(new CustomEvent('websocket:error', {
        detail: {
          error: error.message,
          type: 'boundary_caught',
          timestamp: new Date().toISOString()
        }
      }))
      
      // Set specific error state for WebSocket errors
      this.setState({
        error: error,
        errorInfo: errorInfo,
        isWebSocketError: true
      })
    } else {
      this.setState({
        error: error,
        errorInfo: errorInfo,
        isWebSocketError: false
      })
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            p: 3,
            backgroundColor: '#f5f5f5'
          }}
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              boxShadow: 3
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2
              }}
            />
            
            <Typography variant="h4" component="h1" gutterBottom color="error">
              {this.state.isWebSocketError ? '연결 문제가 발생했습니다' : '앗! 문제가 발생했습니다'}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.isWebSocketError 
                ? '실시간 연결에 문제가 발생했습니다. 네트워크 연결을 확인하고 페이지를 새로고침해 주세요.'
                : '예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.'
              }
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                오류 정보:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem', overflow: 'auto' }}>
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleReload}
                color="primary"
              >
                페이지 새로고침
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
                color="secondary"
              >
                다시 시도
              </Button>
            </Box>

            {/* Development mode: Show detailed error info */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" gutterBottom>
                  개발자 정보 (개발 모드에서만 표시):
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Box>
      )
    }

    // If no error, render children normally
    return this.props.children
  }
}

export default ErrorBoundary