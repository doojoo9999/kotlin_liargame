import React, {useEffect, useState} from 'react'
import {Alert, Avatar, Box, Button, Chip, LinearProgress, Paper, TextField, Typography} from '@mui/material'
import {
    CheckCircle as CompleteIcon,
    Psychology as BrainIcon,
    Send as SendIcon,
    Timer as TimerIcon
} from '@mui/icons-material'
import {useGame} from '../stores/useGame'

const LiarGuessComponent = ({ 
  isLiar, 
  guessTimeLimit = 30, 
  gameNumber,
  citizenSubject = '' 
}) => {
  const { submitLiarGuess, currentUser } = useGame()
  
  const [guess, setGuess] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(guessTimeLimit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Timer effect
  useEffect(() => {
    if (!isLiar || hasSubmitted) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // 시간 초과 시 자동 제출
          if (!hasSubmitted) {
            handleAutoSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isLiar, hasSubmitted])

  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true)
      await submitLiarGuess(gameNumber, guess || '모르겠습니다')
      setHasSubmitted(true)
    } catch (error) {
      console.error('Auto submit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitGuess = async () => {
    if (hasSubmitted || isSubmitting || !guess.trim()) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      await submitLiarGuess(gameNumber, guess)
      setHasSubmitted(true)
      
    } catch (error) {
      console.error('Failed to submit guess:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    return `${seconds}초`
  }

  const progressValue = ((guessTimeLimit - timeRemaining) / guessTimeLimit) * 100

  // 방관자 모드 (라이어가 아닌 경우)
  if (!isLiar) {
    return (
      <Paper sx={{ p: 4, bgcolor: 'info.light', textAlign: 'center' }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 2,
            bgcolor: 'warning.main'
          }}
        >
          <BrainIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          라이어가 주제를 추리하는 중입니다...
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          라이어가 정답을 맞출 수 있을까요?
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <TimerIcon />
          <Typography variant="h6" fontWeight="bold">
            {formatTime(timeRemaining)}
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progressValue}
          sx={{ 
            mt: 2,
            height: 8, 
            borderRadius: 4
          }}
        />
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 4, bgcolor: 'warning.light', borderRadius: 3 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 2 }}>
          🧠 마지막 기회입니다!
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          주제를 맞춰서 승리를 쟁취하세요!
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <TimerIcon color="error" />
          <Typography 
            variant="h5" 
            color={timeRemaining <= 10 ? 'error.main' : 'text.primary'} 
            fontWeight="bold"
          >
            {formatTime(timeRemaining)}
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={progressValue}
          sx={{ 
            height: 10, 
            borderRadius: 5,
            bgcolor: 'rgba(255,255,255,0.5)',
            '& .MuiLinearProgress-bar': {
              bgcolor: timeRemaining > 10 ? 'success.main' : 'error.main'
            }
          }}
        />
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 추측 입력 필드 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="주제를 입력하세요"
          placeholder="예: 음식, 동물, 영화 등..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={hasSubmitted || isSubmitting}
          inputProps={{ maxLength: 50 }}
          sx={{ 
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              fontSize: '1.2rem',
              '&:hover fieldset': {
                borderColor: 'warning.main',
              },
            },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {guess.length}/50자
        </Typography>
      </Box>

      {/* 제출 버튼 */}
      <Button
        variant="contained"
        color="warning"
        size="large"
        fullWidth
        startIcon={hasSubmitted ? <CompleteIcon /> : <SendIcon />}
        onClick={handleSubmitGuess}
        disabled={hasSubmitted || isSubmitting || !guess.trim()}
        sx={{ 
          fontWeight: 'bold',
          py: 2,
          fontSize: '1.1rem'
        }}
      >
        {isSubmitting ? '제출 중...' : hasSubmitted ? '추측 완료' : '주제 맞히기!'}
      </Button>

      {/* 완료 메시지 */}
      {hasSubmitted && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Chip 
            icon={<CompleteIcon />}
            label="추측이 제출되었습니다. 결과를 기다려주세요..."
            color="success"
            variant="outlined"
            sx={{ px: 2 }}
          />
        </Box>
      )}
    </Paper>
  )
}

export default LiarGuessComponent