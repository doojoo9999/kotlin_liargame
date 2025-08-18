import React from 'react'
import {Alert, Box, Button, Paper, Typography} from '../components/ui'
import {AlertCircle as ErrorIcon, RefreshCw as RefreshIcon} from 'lucide-react'

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
        <Box $display="flex" $justifyContent="center" $alignItems="center" $height="100vh" $padding="24px" style={{ backgroundColor: '#f5f5f5' }}>
          <Paper style={{ padding: '32px', maxWidth: '600px', textAlign: 'center', borderRadius: '16px', backgroundColor: 'white', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
            <Box $display="flex" $justifyContent="center" $margin="0 0 16px 0">
              <ErrorIcon style={{ color: '#f44336', width: '64px', height: '64px' }} />
            </Box>
            
            <Typography variant="h4" component="h1" color="#f44336" style={{ marginBottom: '16px', fontWeight: 'bold' }}>
              {this.state.isWebSocketError ? '연결 문제가 발생했습니다' : '앗! 문제가 발생했습니다'}
            </Typography>
            
            <Typography variant="body1" color="#666" style={{ marginBottom: '24px', lineHeight: '1.5' }}>
              {this.state.isWebSocketError 
                ? '실시간 연결에 문제가 발생했습니다. 네트워크 연결을 확인하고 페이지를 새로고침해 주세요.'
                : '예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.'
              }
            </Typography>

            <Alert severity="error" style={{ marginBottom: '24px', textAlign: 'left' }}>
              <Typography variant="subtitle2" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                오류 정보:
              </Typography>
              <Typography component="pre" style={{ fontSize: '0.8rem', overflow: 'auto', fontFamily: 'monospace' }}>
                {this.state.error && this.state.error.toString()}
              </Typography>
            </Alert>

            <Box $display="flex" $gap="16px" $justifyContent="center" $margin="24px 0 0 0">
              <Button
                variant="contained"
                onClick={this.handleReload}
                startIcon={<RefreshIcon size={20} />}
                style={{ borderRadius: '8px' }}
              >
                페이지 새로고침
              </Button>
              
              <Button
                variant="outlined"
                onClick={this.handleReset}
                style={{ borderRadius: '8px' }}
              >
                다시 시도
              </Button>
            </Box>

            {/* Development mode: Show detailed error info */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <Box $margin="24px 0 0 0" style={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                  개발자 정보 (개발 모드에서만 표시):
                </Typography>
                <Box style={{ 
                  padding: '16px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '8px', 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  fontFamily: "'Courier New', monospace", 
                  fontSize: '0.75rem', 
                  whiteSpace: 'pre-wrap' 
                }}>
                  {this.state.errorInfo.componentStack}
                </Box>
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