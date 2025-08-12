import React, {useState} from 'react'
import {Alert, Box, Button, CircularProgress, Container, Paper, Snackbar, TextField, Typography} from '@mui/material'
import {AdminPanelSettings as AdminIcon, Login as LoginIcon} from '@mui/icons-material'
import {useNavigate} from 'react-router-dom'
import apiClient from '../api/apiClient'

function AdminLoginPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')

  const handlePasswordChange = (event) => {
    const value = event.target.value
    setPassword(value)

    if (validationError) {
      setValidationError('')
    }
  }

  const validatePassword = (password) => {
    if (!password || password.trim().length === 0) {
      return '관리자 비밀번호를 입력해주세요.'
    }
    
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedPassword = password.trim()
    const validationError = validatePassword(trimmedPassword)
    
    if (validationError) {
      setValidationError(validationError)
      return
    }

    setLoading(true)

    try {
      console.log('[DEBUG_LOG] Attempting admin login')
      const response = await apiClient.post('/admin/login', { password: trimmedPassword })
      
      // Store admin session data (JWT 토큰 제거)
      localStorage.setItem('isUserAdmin', 'true')
      localStorage.setItem('userData', JSON.stringify({ isAdmin: true }))
      
      setSnackbarMessage('관리자 로그인 성공!')
      setSnackbarSeverity('success')
      setSnackbarOpen(true)
      
      console.log('[DEBUG_LOG] Admin login successful')
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        navigate('/admin')
      }, 1000)
      
    } catch (error) {
      console.error('[DEBUG_LOG] Admin login failed:', error)
      
      // Handle specific error cases
      let errorMessage = '관리자 로그인에 실패했습니다.'
      
      if (error.response?.status === 401) {
        errorMessage = '잘못된 관리자 비밀번호입니다.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setSnackbarMessage(errorMessage)
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Admin Title and Icon */}
          <Box sx={{ mb: 4 }}>
            <AdminIcon 
              sx={{ 
                fontSize: 64, 
                color: '#ff6b6b', 
                mb: 2 
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: '#ff6b6b',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              관리자 페이지
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              관리자 비밀번호를 입력하세요
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="관리자 비밀번호"
              type="password"
              variant="outlined"
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              error={!!validationError}
              helperText={validationError || '관리자 비밀번호를 입력해주세요'}
              disabled={loading}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }
              }}
              inputProps={{
                autoComplete: 'current-password'
              }}
              autoFocus
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              disabled={loading || !password.trim()}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 3,
                backgroundColor: '#ff6b6b',
                '&:hover': {
                  backgroundColor: '#ee5a24',
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  backgroundColor: 'grey.300'
                }
              }}
            >
              {loading ? '접속 중...' : '관리자 페이지 접속'}
            </Button>
          </Box>

          {/* Back to Main */}
          <Button
            variant="text"
            onClick={() => navigate('/')}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            메인 페이지로 돌아가기
          </Button>
        </Paper>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '0.95rem'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AdminLoginPage