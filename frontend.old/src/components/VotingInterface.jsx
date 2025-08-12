import React, {useEffect, useState} from 'react'
import {
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
import {CheckCircle as CheckIcon, Timer as TimerIcon} from '@mui/icons-material'
import {useGame} from '../context/GameContext'

const VotingInterface = ({ players, votingTimeLimit = 60, gameNumber }) => {
  const { castVote, currentUser } = useGame()
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(votingTimeLimit)
  const [votingProgress, setVotingProgress] = useState({ voted: 0, total: players.length })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handlePlayerSelect = (player) => {
    if (hasVoted || player.id === currentUser?.id) return
    setSelectedPlayer(player)
    setConfirmDialogOpen(true)
  }

  const handleVoteConfirm = async () => {
    if (!selectedPlayer) return

    try {
      await castVote(gameNumber, selectedPlayer.id)
      setHasVoted(true)
      setConfirmDialogOpen(false)
      setVotingProgress(prev => ({ ...prev, voted: prev.voted + 1 }))
    } catch (error) {
      console.error('Failed to cast vote:', error)
      alert('투표에 실패했습니다.')
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
      {/* 투표 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 2 }}>
          🗳️ 라이어를 지목해 주세요
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <TimerIcon color="error" />
          <Typography variant="h5" color="error.main" fontWeight="bold">
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
              bgcolor: timeRemaining > 20 ? 'success.main' : 'error.main'
            }
          }}
        />
        
        <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
          투표 현황: {votingProgress.voted} / {votingProgress.total}
        </Typography>
      </Box>

      {/* 플레이어 선택 그리드 */}
      <Grid container spacing={2}>
        {players.filter(player => player.id !== currentUser?.id).map((player) => (
          <Grid item xs={6} sm={4} md={3} key={player.id}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                cursor: hasVoted ? 'default' : 'pointer',
                border: selectedPlayer?.id === player.id ? '3px solid #ff9800' : '1px solid #ddd',
                bgcolor: hasVoted ? 'grey.200' : 'white',
                opacity: hasVoted ? 0.6 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: !hasVoted ? 'translateY(-4px)' : 'none',
                  boxShadow: !hasVoted ? '0 8px 24px rgba(0,0,0,0.15)' : 'none'
                }
              }}
              onClick={() => handlePlayerSelect(player)}
            >
              <Avatar
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mx: 'auto', 
                  mb: 1,
                  bgcolor: `hsl(${player.id * 30}, 70%, 50%)`
                }}
              >
                {player.nickname.charAt(0)}
              </Avatar>
              
              <Typography variant="h6" fontWeight="bold">
                {player.nickname}
              </Typography>
              
              {selectedPlayer?.id === player.id && !hasVoted && (
                <Chip 
                  label="선택됨" 
                  color="warning" 
                  size="small" 
                  sx={{ mt: 1 }}
                />
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* 투표 완료 메시지 */}
      {hasVoted && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Chip 
            icon={<CheckIcon />}
            label="투표 완료! 다른 플레이어들을 기다리는 중..."
            color="success"
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: '1rem' }}
          />
        </Box>
      )}

      {/* 투표 확인 다이얼로그 */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>투표 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 <strong>{selectedPlayer?.nickname}</strong>님을 라이어로 지목하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            투표 후에는 변경할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            취소
          </Button>
          <Button onClick={handleVoteConfirm} variant="contained" color="warning">
            투표하기
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default VotingInterface