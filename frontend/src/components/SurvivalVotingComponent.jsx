import React, {useState} from 'react'
import {Alert, Box, Button, Card, CardContent, Chip, Paper, PlayerAvatar as Avatar, Typography} from '@components/ui'
import {
    Gavel as GavelIcon,
    ThumbsDown as ThumbDownIcon,
    ThumbsUp as ThumbUpIcon,
    User as PersonIcon,
    Vote as VoteIcon
} from 'lucide-react'

const SurvivalVotingComponent = ({ 
  gameTimer, 
  onCastSurvivalVote, 
  isVoted = false, 
  isLoading = false,
  error = null,
  accusedPlayer,
  votingProgress = { spare: 0, eliminate: 0, total: 0 },
  players = []
}) => {
  const [selectedVote, setSelectedVote] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle vote selection and submission
  const handleVote = async (survival) => {
    if (isVoted || isSubmitting) return

    setSelectedVote(survival)
    setIsSubmitting(true)
    
    try {
      await onCastSurvivalVote(survival)
      console.log('[DEBUG_LOG] Survival vote cast:', survival)
    } catch (error) {
      console.error('Failed to cast survival vote:', error)
      setSelectedVote(null)
    } finally {
      setIsSubmitting(false)
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
    const maxTime = 60 // Assuming 60 seconds for survival voting phase
    return ((maxTime - gameTimer) / maxTime) * 100
  }

  // Calculate vote percentages
  const getTotalVotes = () => votingProgress.spare + votingProgress.eliminate
  const getSparePercentage = () => {
    const total = getTotalVotes()
    return total > 0 ? (votingProgress.spare / total) * 100 : 0
  }
  const getEliminatePercentage = () => {
    const total = getTotalVotes()
    return total > 0 ? (votingProgress.eliminate / total) * 100 : 0
  }

  if (isVoted) {
    return (
      <Fade in={true}>
        <Card 
          sx={{ 
            minWidth: 500,
            backgroundColor: 'success.light',
            color: 'white',
            border: '2px solid',
            borderColor: 'success.main'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <VoteIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              투표가 완료되었습니다
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              선택: <strong>{selectedVote ? '살린다' : '죽인다'}</strong>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              다른 플레이어들의 투표를 기다리는 중...
            </Typography>
            
            {/* Real-time vote count */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                현재 투표 현황 ({getTotalVotes()}/{votingProgress.total})
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Chip 
                  icon={<ThumbUpIcon />}
                  label={`살린다 ${votingProgress.spare}`}
                  color="success"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip 
                  icon={<ThumbDownIcon />}
                  label={`죽인다 ${votingProgress.eliminate}`}
                  color="error"
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>
    )
  }

  return (
    <Fade in={true}>
      <Card 
        sx={{ 
          minWidth: 500,
          backgroundColor: 'warning.main',
          color: 'white',
          border: '3px solid',
          borderColor: 'warning.dark',
          boxShadow: '0 0 20px rgba(255, 152, 0, 0.5)'
        }}
      >
        <CardContent>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <GavelIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              ⚖️ 생존 투표
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              지목된 플레이어의 운명을 결정하세요
            </Typography>
          </Box>

          {/* Accused Player Info */}
          {accusedPlayer && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.3)',
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <Avatar 
                  src={accusedPlayer.avatarUrl} 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    mr: 2,
                    border: '3px solid white'
                  }}
                >
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {accusedPlayer.nickname}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    지목된 플레이어
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

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

          {/* Real-time Vote Count */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
              현재 투표 현황 ({getTotalVotes()}/{votingProgress.total})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Chip 
                  icon={<ThumbUpIcon />}
                  label={`살린다 ${votingProgress.spare}`}
                  color="success"
                  sx={{ 
                    fontSize: '1rem',
                    py: 2,
                    px: 1,
                    backgroundColor: 'success.main',
                    color: 'white'
                  }}
                />
                <LinearProgress 
                  variant="determinate" 
                  value={getSparePercentage()}
                  color="success"
                  sx={{ 
                    mt: 1, 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Chip 
                  icon={<ThumbDownIcon />}
                  label={`죽인다 ${votingProgress.eliminate}`}
                  color="error"
                  sx={{ 
                    fontSize: '1rem',
                    py: 2,
                    px: 1,
                    backgroundColor: 'error.main',
                    color: 'white'
                  }}
                />
                <LinearProgress 
                  variant="determinate" 
                  value={getEliminatePercentage()}
                  color="error"
                  sx={{ 
                    mt: 1, 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.3)'
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Voting Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<ThumbUpIcon />}
              onClick={() => handleVote(true)}
              disabled={isLoading || isSubmitting}
              sx={{
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: 'success.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'success.dark'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              살린다
            </Button>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<ThumbDownIcon />}
              onClick={() => handleVote(false)}
              disabled={isLoading || isSubmitting}
              sx={{
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: 'error.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'error.dark'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.5)'
                }
              }}
            >
              죽인다
            </Button>
          </Box>

          {/* Instructions */}
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              textAlign: 'center', 
              opacity: 0.8,
              fontStyle: 'italic'
            }}
          >
            신중하게 선택하세요. 투표는 한 번만 가능합니다.
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default SurvivalVotingComponent