import React, {useEffect, useState} from 'react'
import {Box, Button, Paper, Typography} from '@components/ui'
import {Check as CheckIcon, Clock as TimerIcon} from 'lucide-react'
import {useGame} from '../context/GameContext'

const SpeechControls = ({ isCurrentTurn, currentSpeaker }) => {
  const { completeSpeech, currentRoom } = useGame()
  const [speechTimer, setSpeechTimer] = useState(60)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    if (!isCurrentTurn || hasCompleted) return

    const timer = setInterval(() => {
      setSpeechTimer(prev => {
        if (prev <= 1) {
          // 시간 종료 시 자동으로 발언 완료 처리
          handleCompleteSpeech()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isCurrentTurn, hasCompleted])

  const handleCompleteSpeech = async () => {
    if (hasCompleted) return
    
    try {
      await completeSpeech(currentRoom.gameNumber)
      setHasCompleted(true)
      setSpeechTimer(0)
    } catch (error) {
      console.error('Failed to complete speech:', error)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = ((60 - speechTimer) / 60) * 100

  if (!isCurrentTurn) {
    return (
      <Paper style={{ padding: 16, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
        <Typography variant="body1" style={{ color: '#666666' }}>
          {currentSpeaker ? `${currentSpeaker.nickname}님이 발언 중입니다...` : '다른 플레이어의 차례입니다'}
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper style={{ padding: 24, backgroundColor: '#90caf9', color: 'white' }}>
      <Box style={{ textAlign: 'center', marginBottom: 16 }}>
        <Typography variant="h6" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <TimerIcon />
          당신의 발언 차례입니다
        </Typography>
        
        <Typography variant="h4" style={{ fontWeight: 'bold', marginBottom: 16 }}>
          {formatTime(speechTimer)}
        </Typography>

        {/* Custom Progress Bar */}
        <Box style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.3)',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Box style={{
            width: `${progressValue}%`,
            height: '100%',
            backgroundColor: speechTimer > 10 ? '#4caf50' : '#f44336',
            borderRadius: 4,
            transition: 'width 0.3s ease'
          }} />
        </Box>
      </Box>

      <Button
        variant="contained"
        size="large"
        startIcon={<CheckIcon />}
        onClick={handleCompleteSpeech}
        disabled={hasCompleted}
        style={{ 
          width: '100%',
          backgroundColor: '#4caf50',
          fontWeight: 'bold',
          ...(hasCompleted ? { backgroundColor: '#81c784' } : {})
        }}
      >
        {hasCompleted ? '발언 완료됨' : '발언 완료'}
      </Button>
    </Paper>
  )
}

export default SpeechControls