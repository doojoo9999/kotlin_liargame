import React, {useState} from 'react'
import {Alert, Box, Button, Card, CardContent, Input as TextField, Typography} from '@components/ui'
import {CheckCircle as CheckIcon, Send as SendIcon} from 'lucide-react'

const HintInputComponent = ({ 
  gameTimer, 
  onSubmitHint, 
  isSubmitted = false, 
  isLoading = false,
  error = null 
}) => {
  const [hint, setHint] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle hint input change with character limit
  const handleHintChange = (event) => {
    const value = event.target.value
    if (value.length <= 30) {
      setHint(value)
    }
  }

  // Handle hint submission
  const handleSubmit = async () => {
    if (!hint.trim() || isSubmitted || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmitHint(hint.trim())
      setHint('')
    } catch (error) {
      console.error('Failed to submit hint:', error)
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

  // Calculate progress percentage for visual indicator
  const getProgressValue = () => {
    const maxTime = 60 // Assuming 60 seconds max for hint phase
    return Math.max(0, Math.min(100, (gameTimer / maxTime) * 100))
  }

  if (isSubmitted) {
    return (
      <Fade in={true}>
        <Card 
          sx={{ 
            minWidth: 400,
            maxWidth: 500,
            mx: 'auto',
            backgroundColor: 'success.light',
            color: 'white'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              제출 완료
            </Typography>
            <Typography variant="body2">
              힌트가 성공적으로 제출되었습니다.
            </Typography>
            {gameTimer > 0 && (
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                남은 시간: {gameTimer}초
              </Typography>
            )}
          </CardContent>
        </Card>
      </Fade>
    )
  }

  return (
    <Fade in={true}>
      <Card 
        sx={{ 
          minWidth: 400,
          maxWidth: 500,
          mx: 'auto',
          boxShadow: 3,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 6
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
            💡 힌트 입력
          </Typography>

          {/* Timer Display */}
          {gameTimer > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  남은 시간
                </Typography>
                <Typography 
                  variant="h6" 
                  color={getTimerColor()}
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: gameTimer <= 10 ? '1.5rem' : '1.25rem',
                    animation: gameTimer <= 10 ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }}
                >
                  {gameTimer}초
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getProgressValue()} 
                color={getTimerColor()}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Hint Input Field */}
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="힌트를 입력하세요... (최대 30자)"
            value={hint}
            onChange={handleHintChange}
            onKeyPress={handleKeyPress}
            disabled={isSubmitting || isLoading}
            sx={{ mb: 2 }}
            helperText={`${hint.length}/30 글자`}
            FormHelperTextProps={{
              sx: { 
                textAlign: 'right',
                color: hint.length >= 25 ? 'warning.main' : 'text.secondary'
              }
            }}
          />

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!hint.trim() || isSubmitting || isLoading}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark'
              },
              '&:disabled': {
                backgroundColor: 'grey.300'
              }
            }}
          >
            {isSubmitting || isLoading ? '제출 중...' : '힌트 제출'}
          </Button>

          {/* Instructions */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mt: 2, textAlign: 'center', fontSize: '0.875rem' }}
          >
            다른 플레이어들이 주제를 맞출 수 있도록 도움이 되는 힌트를 작성해주세요.
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default HintInputComponent