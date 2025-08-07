import React, {useState} from 'react'
import {Alert, Box, Button, Card, CardContent, Fade, LinearProgress, Paper, TextField, Typography} from '@mui/material'
import {CheckCircle as CheckIcon, Gavel as GavelIcon, Send as SendIcon} from '@mui/icons-material'

const DefenseComponent = ({ 
  gameTimer, 
  onSubmitDefense, 
  isSubmitted = false, 
  isLoading = false,
  error = null,
  accusedPlayerId,
  currentUserId,
  accusedPlayerName
}) => {
  const [defenseText, setDefenseText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if current user is the accused player
  const isAccusedPlayer = accusedPlayerId === currentUserId

  // Handle defense text input change with character limit
  const handleDefenseChange = (event) => {
    const value = event.target.value
    if (value.length <= 100) {
      setDefenseText(value)
    }
  }

  // Handle defense submission
  const handleSubmit = async () => {
    if (!defenseText.trim() || isSubmitted || isSubmitting || !isAccusedPlayer) return

    setIsSubmitting(true)
    try {
      await onSubmitDefense(defenseText.trim())
      setDefenseText('')
    } catch (error) {
      console.error('Failed to submit defense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (gameTimer <= 10) return 'error'
    if (gameTimer <= 30) return 'warning'
    return 'primary'
  }

  // Calculate progress percentage
  const getProgressValue = () => {
    const maxTime = 60 // Assuming 60 seconds for defense phase
    return ((maxTime - gameTimer) / maxTime) * 100
  }

  if (isSubmitted) {
    return (
      <Fade in={true}>
        <Card 
          sx={{ 
            minWidth: 400,
            backgroundColor: 'success.light',
            color: 'white',
            border: '2px solid',
            borderColor: 'success.main'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              변론이 제출되었습니다
            </Typography>
            <Typography variant="body2">
              다른 플레이어들이 변론을 확인하고 있습니다
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    )
  }

  if (!isAccusedPlayer) {
    return (
      <Fade in={true}>
        <Paper 
          sx={{ 
            minWidth: 400,
            p: 3,
            textAlign: 'center',
            backgroundColor: 'error.light',
            color: 'white',
            border: '2px solid',
            borderColor: 'error.main'
          }}
        >
          <GavelIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            🎭 변론 단계
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{accusedPlayerName || '지목된 플레이어'}</strong>님이 변론 중입니다
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            변론을 기다리는 중...
          </Typography>
          {gameTimer > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" color="inherit" sx={{ mb: 1 }}>
                {gameTimer}초
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProgressValue()}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
          )}
        </Paper>
      </Fade>
    )
  }

  return (
    <Fade in={true}>
      <Card 
        sx={{ 
          minWidth: 400,
          backgroundColor: 'error.main',
          color: 'white',
          border: '3px solid',
          borderColor: 'error.dark',
          boxShadow: '0 0 20px rgba(244, 67, 54, 0.5)',
          animation: 'pulse 2s infinite'
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <GavelIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              🎭 변론 기회
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              당신이 지목되었습니다. 변론해주세요!
            </Typography>
          </Box>

          {/* Timer Display */}
          {gameTimer > 0 && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                variant="h3" 
                color={getTimerColor()}
                sx={{ 
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  color: 'white'
                }}
              >
                {gameTimer}초
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProgressValue()}
                color={getTimerColor()}
                sx={{ 
                  mt: 1, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Defense Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="변론을 입력하세요... (최대 100자)"
              value={defenseText}
              onChange={handleDefenseChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    borderWidth: 2
                  },
                  '&:hover fieldset': {
                    borderColor: 'white'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'white',
                    borderWidth: 3
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                  fontSize: '1.1rem'
                }
              }}
            />
            
            {/* Character Counter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                변론으로 무죄를 증명하세요
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.8,
                  color: defenseText.length > 90 ? 'warning.light' : 'inherit'
                }}
              >
                {defenseText.length}/100
              </Typography>
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={isSubmitting ? null : <SendIcon />}
            onClick={handleSubmit}
            disabled={!defenseText.trim() || isLoading || isSubmitting}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backgroundColor: 'white',
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'grey.100'
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            {isSubmitting ? '제출 중...' : '변론 제출'}
          </Button>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default DefenseComponent