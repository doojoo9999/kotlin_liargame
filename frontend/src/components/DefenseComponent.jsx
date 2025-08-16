import React, {useEffect, useState} from 'react'
import {Alert, Box, Button, Chip, Input as TextField, Paper, PlayerAvatar as Avatar, Typography} from '@components/ui'
import {
    CheckCircle as CompleteIcon,
    MessageCircle as DefenseIcon,
    Send as SendIcon,
    Timer as TimerIcon
} from 'lucide-react'
import {useGame} from '../stores/useGame'

const DefenseComponent = ({ 
  accusedPlayer, 
  isDefending, 
  defenseTimeLimit = 60, 
  gameNumber,
  defenseText: existingDefenseText = null,
  isDefenseSubmitted = false 
}) => {
  const { submitDefense, currentUser } = useGame()
  
  const [defenseText, setDefenseText] = useState(existingDefenseText || '')
  const [hasSubmitted, setHasSubmitted] = useState(isDefenseSubmitted)
  const [timeRemaining, setTimeRemaining] = useState(defenseTimeLimit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Timer effect
  useEffect(() => {
    if (!isDefending || hasSubmitted) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // 시간 초과 시 자동 제출 (빈 텍스트로)
          if (!hasSubmitted) {
            handleAutoSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isDefending, hasSubmitted])

  const handleAutoSubmit = async () => {
    try {
      setIsSubmitting(true)
      await submitDefense(gameNumber, defenseText || '시간이 부족했습니다.')
      setHasSubmitted(true)
    } catch (error) {
      console.error('Auto submit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDefense = async () => {
    if (hasSubmitted || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      await submitDefense(gameNumber, defenseText)
      setHasSubmitted(true)
      
    } catch (error) {
      console.error('Failed to submit defense:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = ((defenseTimeLimit - timeRemaining) / defenseTimeLimit) * 100

  // 방관자 모드 (변론 중이 아닌 경우)
  if (!isDefending) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'info.light', textAlign: 'center' }}>
        <Avatar
          sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 2,
            bgcolor: 'error.main'
          }}
        >
          <DefenseIcon sx={{ fontSize: 40 }} />
        </Avatar>
        
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          {accusedPlayer?.nickname || 'Unknown'}님이 변론 중입니다
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          변론을 들어보세요...
        </Typography>

        {existingDefenseText && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
            <Typography variant="body1" fontStyle="italic">
              "{existingDefenseText}"
            </Typography>
          </Paper>
        )}
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 4, bgcolor: 'error.light', borderRadius: 3 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.dark', mb: 2 }}>
          ⚖️ 변론의 시간입니다
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

        <Box style={{
          height: '10px',
          borderRadius: '5px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Box style={{
            width: `${progressValue}%`,
            height: '100%',
            backgroundColor: timeRemaining > 10 ? '#ff9800' : '#f44336',
            borderRadius: '5px',
            transition: 'width 0.3s ease'
          }} />
        </Box>
        
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          당신을 변호할 마지막 기회입니다!
        </Typography>
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 변론 입력 필드 */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="당신의 변론을 입력하세요... (예: 저는 라이어가 아닙니다. 왜냐하면...)"
          value={defenseText}
          onChange={(e) => setDefenseText(e.target.value)}
          disabled={hasSubmitted || isSubmitting}
          inputProps={{ maxLength: 200 }}
          sx={{ 
            bgcolor: 'white',
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: 'error.main',
              },
            },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {defenseText.length}/200자
        </Typography>
      </Box>

      {/* 제출 버튼 */}
      <Button
        variant="contained"
        color="error"
        size="large"
        fullWidth
        startIcon={hasSubmitted ? <CompleteIcon /> : <SendIcon />}
        onClick={handleSubmitDefense}
        disabled={hasSubmitted || isSubmitting}
        sx={{ 
          fontWeight: 'bold',
          py: 2
        }}
      >
        {isSubmitting ? '제출 중...' : hasSubmitted ? '변론 완료' : '변론 제출'}
      </Button>

      {/* 완료 메시지 */}
      {hasSubmitted && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Chip 
            icon={<CompleteIcon />}
            label="변론이 제출되었습니다. 최종 투표를 기다려주세요..."
            color="success"
            variant="outlined"
            sx={{ px: 2 }}
          />
        </Box>
      )}
    </Paper>
  )
}

export default DefenseComponent