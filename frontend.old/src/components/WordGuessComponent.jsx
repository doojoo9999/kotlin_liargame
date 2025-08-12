import React, {useState} from 'react'
import {Alert, Box, Button, Card, CardContent, Fade, LinearProgress, Paper, TextField, Typography} from '@mui/material'
import {
    Cancel as CancelIcon,
    CheckCircle as CheckIcon,
    EmojiObjects as BulbIcon,
    HourglassEmpty as WaitIcon,
    Send as SendIcon
} from '@mui/icons-material'

const WordGuessComponent = ({ 
  gameTimer, 
  onGuessWord, 
  onRestartGame,
  isSubmitted = false, 
  isLoading = false,
  error = null,
  playerRole, // 'LIAR' | 'CITIZEN'
  guessResult = null, // { correct: boolean, guessedWord: string, actualWord: string }
  gameResult = null // { winner: 'LIAR' | 'CITIZEN', message: string }
}) => {
  const [guessedWord, setGuessedWord] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLiar = playerRole === 'LIAR'

  // Handle word input change
  const handleWordChange = (event) => {
    const value = event.target.value
    if (value.length <= 20) { // Reasonable limit for word guessing
      setGuessedWord(value)
    }
  }

  // Handle word guess submission
  const handleSubmit = async () => {
    if (!guessedWord.trim() || isSubmitted || isSubmitting || !isLiar) return

    setIsSubmitting(true)
    try {
      await onGuessWord(guessedWord.trim())
      console.log('[DEBUG_LOG] Word guess submitted:', guessedWord.trim())
    } catch (error) {
      console.error('Failed to submit word guess:', error)
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
    const maxTime = 60 // Assuming 60 seconds for word guessing phase
    return ((maxTime - gameTimer) / maxTime) * 100
  }

  // Show game result if available
  if (gameResult) {
    const isLiarWin = gameResult.winner === 'LIAR'
    return (
      <Fade in={true}>
        <Card 
          sx={{ 
            minWidth: 500,
            backgroundColor: isLiarWin ? 'error.main' : 'success.main',
            color: 'white',
            border: '3px solid',
            borderColor: isLiarWin ? 'error.dark' : 'success.dark',
            boxShadow: `0 0 30px ${isLiarWin ? 'rgba(244, 67, 54, 0.7)' : 'rgba(76, 175, 80, 0.7)'}`
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              {isLiarWin ? '🎭' : '👥'}
            </Typography>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              {gameResult.winner === 'LIAR' ? '라이어 승리!' : '시민 승리!'}
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              {gameResult.message}
            </Typography>
            
            {guessResult && (
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                <Typography variant="body1" sx={{ color: 'white' }}>
                  추리한 단어: <strong>{guessResult.guessedWord}</strong>
                </Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  정답: <strong>{guessResult.actualWord}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
                  {guessResult.correct ? '정답입니다!' : '틀렸습니다!'}
                </Typography>
              </Paper>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={onRestartGame}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: isLiarWin ? 'error.main' : 'success.main',
                '&:hover': {
                  backgroundColor: 'grey.100'
                }
              }}
            >
              다시 게임하기
            </Button>
          </CardContent>
        </Card>
      </Fade>
    )
  }

  // Show guess result if submitted
  if (isSubmitted && guessResult) {
    return (
      <Fade in={true}>
        <Card 
          sx={{ 
            minWidth: 500,
            backgroundColor: guessResult.correct ? 'success.main' : 'error.main',
            color: 'white',
            border: '3px solid',
            borderColor: guessResult.correct ? 'success.dark' : 'error.dark'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            {guessResult.correct ? (
              <CheckIcon sx={{ fontSize: 64, mb: 2 }} />
            ) : (
              <CancelIcon sx={{ fontSize: 64, mb: 2 }} />
            )}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {guessResult.correct ? '정답입니다!' : '틀렸습니다!'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              추리한 단어: <strong>{guessResult.guessedWord}</strong>
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              정답: <strong>{guessResult.actualWord}</strong>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              게임 결과를 집계하는 중...
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    )
  }

  // Show waiting message for citizens
  if (!isLiar) {
    return (
      <Fade in={true}>
        <Paper 
          sx={{ 
            minWidth: 500,
            p: 4,
            textAlign: 'center',
            backgroundColor: 'info.main',
            color: 'white',
            border: '2px solid',
            borderColor: 'info.dark'
          }}
        >
          <WaitIcon sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
            🎭 최종 추리 단계
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            라이어가 단어를 추리하는 중입니다...
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 3 }}>
            라이어가 정답을 맞히면 라이어 승리, 틀리면 시민 승리입니다
          </Typography>
          
          {gameTimer > 0 && (
            <Box sx={{ mt: 3 }}>
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

  // Show word guessing interface for liar
  return (
    <Fade in={true}>
      <Card 
        sx={{ 
          minWidth: 500,
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
            <BulbIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              🎭 최종 기회!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              단어를 맞혀서 승리하세요!
            </Typography>
          </Box>

          {/* Timer Display */}
          {gameTimer > 0 && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography 
                variant="h3" 
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

          {/* Instructions */}
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <Typography variant="body1" sx={{ color: 'white', textAlign: 'center' }}>
              💡 <strong>힌트:</strong> 게임 중 들었던 모든 힌트를 종합해서 단어를 추리하세요!
            </Typography>
          </Paper>

          {/* Word Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="단어를 입력하세요..."
              value={guessedWord}
              onChange={handleWordChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  fontSize: '1.2rem',
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
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }
              }}
            />
            
            {/* Character Counter */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                마지막 기회입니다. 신중하게!
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.8,
                  color: guessedWord.length > 15 ? 'warning.light' : 'inherit'
                }}
              >
                {guessedWord.length}/20
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
            disabled={!guessedWord.trim() || isLoading || isSubmitting}
            sx={{
              py: 1.5,
              fontSize: '1.2rem',
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
            {isSubmitting ? '추리 중...' : '단어 추리하기'}
          </Button>

          {/* Warning */}
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              textAlign: 'center', 
              opacity: 0.8,
              fontStyle: 'italic',
              color: 'warning.light'
            }}
          >
            ⚠️ 한 번만 추리할 수 있습니다!
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default WordGuessComponent