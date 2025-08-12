import React, {useEffect, useState} from 'react'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    LinearProgress,
    Paper,
    Typography
} from '@mui/material'
import {Clear as KillIcon, Favorite as SpareIcon, Timer as TimerIcon} from '@mui/icons-material'
import {useGame} from '../stores/useGame'

const FinalJudgmentComponent = ({ 
  accusedPlayer, 
  defenseText = '',
  votingTimeLimit = 30,
  gameNumber 
}) => {
  const { castFinalJudgment, currentUser } = useGame()
  
  const [selectedJudgment, setSelectedJudgment] = useState(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(votingTimeLimit)
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState(null)

  // Timer effect
  useEffect(() => {
    if (hasVoted) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // 시간 초과 시 자동 투표 (랜덤)
          if (!hasVoted) {
            handleAutoVote()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasVoted])

  const handleAutoVote = async () => {
    try {
      const randomJudgment = Math.random() > 0.5 ? 'KILL' : 'SPARE'
      setIsVoting(true)
      await castFinalJudgment(gameNumber, randomJudgment)
      setHasVoted(true)
    } catch (error) {
      console.error('Auto vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleJudgmentSelect = (judgment) => {
    if (hasVoted) return
    setSelectedJudgment(judgment)
    setConfirmDialogOpen(true)
  }

  const handleJudgmentConfirm = async () => {
    if (!selectedJudgment) return

    try {
      setIsVoting(true)
      setError(null)
      
      await castFinalJudgment(gameNumber, selectedJudgment)
      setHasVoted(true)
      setConfirmDialogOpen(false)
      
    } catch (error) {
      console.error('Failed to cast final judgment:', error)
      setError(error.message)
    } finally {
      setIsVoting(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressValue = ((votingTimeLimit - timeRemaining) / votingTimeLimit) * 100

  return (
    <Paper sx={{ p: 4, bgcolor: 'warning.light', borderRadius: 3 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 2 }}>
          ⚖️ 최종 판결
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
            height: 8, 
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.5)',
            mb: 2
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Avatar
            sx={{ 
              width: 60, 
              height: 60,
              bgcolor: 'error.main'
            }}
          >
            {accusedPlayer?.nickname?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="h5" fontWeight="bold">
            {accusedPlayer?.nickname || 'Unknown'}님의 운명을 결정하세요
          </Typography>
        </Box>

        {/* 변론 내용 표시 */}
        {defenseText && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
            <Typography variant="body1" fontStyle="italic">
              "{defenseText}"
            </Typography>
          </Paper>
        )}
      </Box>

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 판결 버튼들 */}
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: hasVoted || isVoting ? 'default' : 'pointer',
              bgcolor: selectedJudgment === 'KILL' ? 'error.light' : 'white',
              border: selectedJudgment === 'KILL' ? '3px solid #f44336' : '2px solid #ddd',
              opacity: hasVoted || isVoting ? 0.7 : 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: !hasVoted && !isVoting ? 'translateY(-4px)' : 'none',
                boxShadow: !hasVoted && !isVoting ? '0 8px 24px rgba(244,67,54,0.3)' : 'none'
              }
            }}
            onClick={() => handleJudgmentSelect('KILL')}
          >
            <KillIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="error.main">
              처형
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              이 플레이어를 게임에서 제거합니다
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: hasVoted || isVoting ? 'default' : 'pointer',
              bgcolor: selectedJudgment === 'SPARE' ? 'success.light' : 'white',
              border: selectedJudgment === 'SPARE' ? '3px solid #4caf50' : '2px solid #ddd',
              opacity: hasVoted || isVoting ? 0.7 : 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: !hasVoted && !isVoting ? 'translateY(-4px)' : 'none',
                boxShadow: !hasVoted && !isVoting ? '0 8px 24px rgba(76,175,80,0.3)' : 'none'
              }
            }}
            onClick={() => handleJudgmentSelect('SPARE')}
          >
            <SpareIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" color="success.main">
              생존
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              이 플레이어를 살려둡니다
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 투표 완료 메시지 */}
      {hasVoted && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Chip 
            label="투표 완료! 다른 플레이어들을 기다리는 중..."
            color="success"
            variant="outlined"
            sx={{ px: 2, fontSize: '1rem' }}
          />
        </Box>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>최종 판결 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 {accusedPlayer?.nickname || 'Unknown'}님을 
            <strong style={{ 
              color: selectedJudgment === 'KILL' ? '#f44336' : '#4caf50' 
            }}>
              {selectedJudgment === 'KILL' ? ' 처형하시겠습니까?' : ' 살리시겠습니까?'}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            이 선택은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isVoting}
          >
            취소
          </Button>
          <Button 
            onClick={handleJudgmentConfirm} 
            variant="contained" 
            color={selectedJudgment === 'KILL' ? 'error' : 'success'}
            disabled={isVoting}
          >
            {isVoting ? '투표 중...' : '확정'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default FinalJudgmentComponent