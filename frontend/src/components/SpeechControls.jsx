import React, {useEffect, useState} from 'react'
import {Box, Button, LinearProgress, Paper, Typography} from '@mui/material'
import {AccessTime as TimerIcon, Check as CheckIcon} from '@mui/icons-material'
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
      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
        <Typography variant="body1" color="text.secondary">
          {currentSpeaker ? `${currentSpeaker.nickname}님이 발언 중입니다...` : '다른 플레이어의 차례입니다'}
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'white' }}>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <TimerIcon />
          당신의 발언 차례입니다
        </Typography>
        
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          {formatTime(speechTimer)}
        </Typography>

        <LinearProgress 
          variant="determinate" 
          value={progressValue}
          sx={{ 
            height: 8, 
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: speechTimer > 10 ? 'success.main' : 'error.main'
            }
          }}
        />
      </Box>

      <Button
        variant="contained"
        color="success"
        size="large"
        fullWidth
        startIcon={<CheckIcon />}
        onClick={handleCompleteSpeech}
        disabled={hasCompleted}
        sx={{ 
          bgcolor: 'success.main',
          '&:hover': { bgcolor: 'success.dark' },
          fontWeight: 'bold'
        }}
      >
        {hasCompleted ? '발언 완료됨' : '발언 완료'}
      </Button>
    </Paper>
  )
}

export default SpeechControls