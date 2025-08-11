import React, {useEffect, useState} from 'react'
import {Alert, Box, Button, CircularProgress, Container, Paper, Snackbar, TextField, Typography} from '@mui/material'
import {Login as LoginIcon, SportsEsports as GameIcon} from '@mui/icons-material'
import {useGame} from '../context/GameContext'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {mapAuthCodeToUiPreset, mapHttpErrorToAuthCode} from '../utils/authErrorMapping'
import {getReturnToFromQuery, persistReturnTo} from '../utils/redirect'
import {Events, trackEvent} from '../utils/analytics'

function LoginPage() {
  const { login, loading, error } = useGame()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [nickname, setNickname] = useState('')
  const [validationError, setValidationError] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  useEffect(() => {
    // Prefill nickname and persist safe returnTo on arrival
    const prefillNick = searchParams.get('nickname')
    if (prefillNick) setNickname(prefillNick)
    const safeReturnTo = getReturnToFromQuery()
    if (safeReturnTo) persistReturnTo(safeReturnTo)
  }, [searchParams])

  const handleNicknameChange = (event) => {
    const value = event.target.value
    setNickname(value)

    if (validationError) {
      setValidationError('')
    }
  }

  const validateNickname = (nickname) => {
    if (!nickname || nickname.trim().length === 0) {
      return '닉네임을 입력해주세요.'
    }
    
    if (nickname.trim().length < 2) {
      return '닉네임은 최소 2글자 이상이어야 합니다.'
    }
    
    if (nickname.trim().length > 12) {
      return '닉네임은 최대 12글자까지 가능합니다.'
    }

    const invalidChars = /[<>\"'&]/
    if (invalidChars.test(nickname)) {
      return '닉네임에 특수문자는 사용할 수 없습니다.'
    }
    
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedNickname = nickname.trim()
    const validationError = validateNickname(trimmedNickname)
    
    if (validationError) {
      setValidationError(validationError)
      return
    }

    try {
      console.log('[DEBUG_LOG] Attempting login with nickname:', trimmedNickname)
      await login(trimmedNickname)

      setSnackbarMessage(`${trimmedNickname}님, 환영합니다!`)
      setSnackbarOpen(true)
      
      console.log('[DEBUG_LOG] Login successful')
    } catch (error) {
      console.error('[DEBUG_LOG] Login failed:', error)

      const errorCode = mapHttpErrorToAuthCode(error)
      const preset = mapAuthCodeToUiPreset(errorCode)
      const returnTo = getReturnToFromQuery()

      // Only include server-provided message for network/server errors to avoid leaking sensitive info
      let errorMessage = ''
      if (errorCode === 'SERVER_ERROR' || errorCode === 'NETWORK_ERROR') {
        errorMessage = error.response?.data?.message || ''
      }

      const params = new URLSearchParams()
      params.set('errorCode', errorCode)
      if (errorMessage) params.set('errorMessage', errorMessage)
      if (returnTo) params.set('returnTo', returnTo)
      if (trimmedNickname) params.set('nickname', trimmedNickname)
      if (preset.defaultRedirectSec) params.set('retryAfterSeconds', String(preset.defaultRedirectSec))

      trackEvent(Events.RedirectStarted, { to: '/auth/login-failed', reason: 'error' })
      navigate(`/auth/login-failed?${params.toString()}`)
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          {/* Game Title and Icon */}
          <Box sx={{ mb: 4 }}>
            <GameIcon 
              sx={{ 
                fontSize: 64, 
                color: 'primary.main', 
                mb: 2 
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              라이어 게임
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              닉네임을 입력하고 게임을 시작하세요!
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="닉네임"
              variant="outlined"
              value={nickname}
              onChange={handleNicknameChange}
              onKeyPress={handleKeyPress}
              error={!!validationError}
              helperText={validationError || '2-12글자의 닉네임을 입력해주세요'}
              disabled={loading.auth}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }
              }}
              inputProps={{
                maxLength: 12,
                autoComplete: 'username'
              }}
              autoFocus
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading.auth ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              disabled={loading.auth || !nickname.trim()}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  backgroundColor: 'grey.300'
                }
              }}
            >
              {loading.auth ? '접속 중...' : '게임 시작'}
            </Button>
          </Box>

          {/* Error Display */}
          {error.auth && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.95rem'
                }
              }}
            >
              {error.auth}
            </Alert>
          )}

          {/* Game Instructions */}
          <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>게임 방법:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
              • 플레이어 중 한 명이 라이어가 됩니다<br />
              • 라이어를 제외한 모든 플레이어는 같은 주제를 받습니다<br />
              • 라이어는 다른 주제나 가짜 키워드를 받습니다<br />
              • 대화를 통해 라이어를 찾아내세요!
            </Typography>
          </Box>

          {/* Version Info */}
          <Typography 
            variant="caption" 
            color="text.disabled" 
            sx={{ mt: 2, display: 'block' }}
          >
            Liar Game v1.0 - Powered by React & Material-UI
          </Typography>
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
          severity={error.auth ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LoginPage