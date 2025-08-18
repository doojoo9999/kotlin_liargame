import React, {useState} from 'react'
import {Alert, Box, Button, Card, CardContent, Input as TextField, Paper, Typography} from '@components/ui'
import {
    CheckCircle as CheckIcon,
    Clock as WaitIcon,
    Lightbulb as BulbIcon,
    Send as SendIcon,
    X as CancelIcon
} from 'lucide-react'

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
      <div style={{
        opacity: 1,
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        <Card style={{
          minWidth: '500px',
          backgroundColor: isLiarWin ? '#f44336' : '#4caf50',
          color: 'white',
          border: `3px solid ${isLiarWin ? '#d32f2f' : '#388e3c'}`,
          boxShadow: isLiarWin ? '0 0 30px rgba(244, 67, 54, 0.7)' : '0 0 30px rgba(76, 175, 80, 0.7)'
        }}>
          <CardContent style={{ textAlign: 'center', padding: '32px' }}>
            <Typography variant="h3" style={{ marginBottom: '16px' }}>
              {isLiarWin ? '🎭' : '👥'}
            </Typography>
            <Typography variant="h4" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {gameResult.winner === 'LIAR' ? '라이어 승리!' : '시민 승리!'}
            </Typography>
            <Typography variant="h6" style={{ marginBottom: '24px', opacity: 0.9 }}>
              {gameResult.message}
            </Typography>
            
            {guessResult && (
              <Paper 
                style={{ 
                  padding: '16px', 
                  marginBottom: '24px', 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                <Typography variant="body1" style={{ color: 'white' }}>
                  추리한 단어: <strong>{guessResult.guessedWord}</strong>
                </Typography>
                <Typography variant="body1" style={{ color: 'white' }}>
                  정답: <strong>{guessResult.actualWord}</strong>
                </Typography>
                <Typography variant="body2" style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
                  {guessResult.correct ? '정답입니다!' : '틀렸습니다!'}
                </Typography>
              </Paper>
            )}

            <Button
              variant="contained"
              size="large"
              onClick={onRestartGame}
              style={{
                padding: '12px 32px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: isLiarWin ? '#f44336' : '#4caf50'
              }}
            >
              다시 게임하기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show guess result if submitted
  if (isSubmitted && guessResult) {
    return (
      <div style={{
        opacity: 1,
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        <Card style={{
          minWidth: '500px',
          backgroundColor: guessResult.correct ? '#4caf50' : '#f44336',
          color: 'white',
          border: `3px solid ${guessResult.correct ? '#388e3c' : '#d32f2f'}`
        }}>
          <CardContent style={{ textAlign: 'center', padding: '24px' }}>
            {guessResult.correct ? (
              <CheckIcon size={64} style={{ marginBottom: '16px' }} />
            ) : (
              <CancelIcon size={64} style={{ marginBottom: '16px' }} />
            )}
            <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {guessResult.correct ? '정답입니다!' : '틀렸습니다!'}
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '8px' }}>
              추리한 단어: <strong>{guessResult.guessedWord}</strong>
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '16px' }}>
              정답: <strong>{guessResult.actualWord}</strong>
            </Typography>
            <Typography variant="body2" style={{ opacity: 0.9 }}>
              게임 결과를 집계하는 중...
            </Typography>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show waiting message for citizens
  if (!isLiar) {
    return (
      <div style={{
        opacity: 1,
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        <Paper style={{
          minWidth: '500px',
          padding: '32px',
          textAlign: 'center',
          backgroundColor: '#2196f3',
          color: 'white',
          border: '2px solid #1976d2'
        }}>
          <WaitIcon size={64} style={{ marginBottom: '16px' }} />
          <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🎭 최종 추리 단계
          </Typography>
          <Typography variant="body1" style={{ marginBottom: '16px' }}>
            라이어가 단어를 추리하는 중입니다...
          </Typography>
          <Typography variant="body2" style={{ opacity: 0.9, marginBottom: '24px' }}>
            라이어가 정답을 맞히면 라이어 승리, 틀리면 시민 승리입니다
          </Typography>
          
          {gameTimer > 0 && (
            <Box style={{ marginTop: '24px' }}>
              <Typography variant="h4" style={{ marginBottom: '8px' }}>
                {gameTimer}초
              </Typography>
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                marginTop: '16px'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                  width: `${getProgressValue()}%`
                }} />
              </div>
            </Box>
          )}
        </Paper>
      </div>
    )
  }

  // Show word guessing interface for liar
  return (
    <div style={{
      opacity: 1,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <Card style={{
        minWidth: '500px',
        backgroundColor: '#f44336',
        color: 'white',
        border: '3px solid #d32f2f',
        boxShadow: '0 0 20px rgba(244, 67, 54, 0.5)',
        animation: 'pulse 2s infinite'
      }}>
        <CardContent>
          {/* Header */}
          <Box style={{ textAlign: 'center', marginBottom: '24px' }}>
            <BulbIcon size={48} style={{ marginBottom: '8px' }} />
            <Typography variant="h5" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              🎭 최종 기회!
            </Typography>
            <Typography variant="body1" style={{ opacity: 0.9 }}>
              단어를 맞혀서 승리하세요!
            </Typography>
          </Box>

          {/* Timer Display */}
          {gameTimer > 0 && (
            <Box style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Typography 
                variant="h3" 
                style={{ 
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  color: 'white'
                }}
              >
                {gameTimer}초
              </Typography>
              <div style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                overflow: 'hidden',
                marginTop: '8px'
              }}>
                <div style={{
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                  width: `${getProgressValue()}%`
                }} />
              </div>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" style={{ marginBottom: '16px' }}>
              {error}
            </Alert>
          )}

          {/* Instructions */}
          <Paper 
            style={{ 
              padding: '16px', 
              marginBottom: '24px', 
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <Typography variant="body1" style={{ color: 'white', textAlign: 'center' }}>
              💡 <strong>힌트:</strong> 게임 중 들었던 모든 힌트를 종합해서 단어를 추리하세요!
            </Typography>
          </Paper>

          {/* Word Input */}
          <Box style={{ marginBottom: '16px' }}>
            <TextField
              placeholder="단어를 입력하세요..."
              value={guessedWord}
              onChange={handleWordChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                fontSize: '1.2rem',
                textAlign: 'center',
                fontWeight: 'bold',
                borderRadius: '4px'
              }}
            />
            
            {/* Character Counter */}
            <Box style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <Typography variant="body2" style={{ opacity: 0.8 }}>
                마지막 기회입니다. 신중하게!
              </Typography>
              <Typography 
                variant="body2" 
                style={{ 
                  opacity: 0.8,
                  color: guessedWord.length > 15 ? '#ffeb3b' : 'inherit'
                }}
              >
                {guessedWord.length}/20
              </Typography>
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={isSubmitting ? null : <SendIcon />}
            onClick={handleSubmit}
            disabled={!guessedWord.trim() || isLoading || isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              backgroundColor: 'white',
              color: '#f44336'
            }}
          >
            {isSubmitting ? '추리 중...' : '단어 추리하기'}
          </Button>

          {/* Warning */}
          <Typography 
            variant="body2" 
            style={{ 
              marginTop: '16px', 
              textAlign: 'center', 
              opacity: 0.8,
              fontStyle: 'italic',
              color: '#ffeb3b'
            }}
          >
            ⚠️ 한 번만 추리할 수 있습니다!
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default WordGuessComponent