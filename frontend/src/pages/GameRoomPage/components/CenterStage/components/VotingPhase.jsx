import React, {useCallback, useState} from 'react'
import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    PlayerAvatar,
    Typography
} from '@components/ui'
import {CheckCircle as CheckIcon, User as PersonIcon, Vote as VoteIcon} from 'lucide-react'

const VotingPhase = React.memo(function VotingPhase({
  players = [],
  currentUser,
  onVote,
  votingProgress = {},
  isVoted = false,
  isLoading = false,
  error = null,
  gameTimer,
  isMobile = false
}) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // Filter out current user from voting options
  const votableePlayers = players.filter(player => player.id !== currentUser?.id)
  
  // Calculate voting statistics
  const totalVoters = players.length - 1 // Exclude the person being voted on
  const totalVotes = Object.keys(votingProgress || {}).length
  const votingPercent = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0

  const handlePlayerSelect = useCallback((playerId) => {
    if (isVoted || isLoading) return
    setSelectedPlayerId(playerId)
  }, [isVoted, isLoading])

  const handleVoteSubmit = useCallback(() => {
    if (!selectedPlayerId || isVoted || isLoading) return
    setShowConfirmDialog(true)
  }, [selectedPlayerId, isVoted, isLoading])

  const handleConfirmVote = useCallback(() => {
    setShowConfirmDialog(false)
    onVote?.(selectedPlayerId)
    setSelectedPlayerId(null)
  }, [selectedPlayerId, onVote])

  const getPlayerVoteStatus = useCallback((playerId) => {
    // Count how many votes this player received
    const votes = Object.values(votingProgress || {}).filter(vote => vote === playerId).length
    return votes
  }, [votingProgress])

  const hasUserVoted = useCallback((userId) => {
    return votingProgress && votingProgress[userId] !== undefined
  }, [votingProgress])

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      {/* Voting Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          🕵️ 라이어를 찾아주세요!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          의심스러운 플레이어를 선택하여 투표하세요
        </Typography>

        {/* Voting Progress Circle */}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={votingPercent}
              size={80}
              thickness={6}
              sx={{
                color: votingPercent >= 100 ? 'success.main' : 'primary.main',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {totalVotes}/{totalVoters}
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              투표 진행률
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {Math.round(votingPercent)}%
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Player Selection Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {votableePlayers.map((player) => {
          const votes = getPlayerVoteStatus(player.id)
          const isSelected = selectedPlayerId === player.id
          const hasVoted = hasUserVoted(player.id)
          
          return (
            <Grid item xs={6} sm={4} md={3} key={player.id}>
              <Card
                elevation={isSelected ? 8 : 2}
                sx={{
                  p: 2,
                  cursor: isVoted || isLoading ? 'default' : 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  border: isSelected ? '3px solid' : '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'grey.300',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  backgroundColor: isVoted && !isSelected ? 'grey.50' : 'background.paper',
                  '&:hover': {
                    ...(!(isVoted || isLoading) && {
                      transform: 'scale(1.02)',
                      boxShadow: 4
                    })
                  },
                  ...(isSelected && {
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.05))'
                  })
                }}
                onClick={() => handlePlayerSelect(player.id)}
              >
                {/* Selection Checkmark */}
                {isSelected && (
                  <CheckIcon
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'primary.main',
                      fontSize: '1.5rem',
                      animation: 'fadeIn 0.3s ease',
                      '@keyframes fadeIn': {
                        '0%': { opacity: 0, transform: 'scale(0)' },
                        '100%': { opacity: 1, transform: 'scale(1)' }
                      }
                    }}
                  />
                )}

                {/* Player Avatar */}
                <PlayerAvatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 1,
                    backgroundColor: isSelected ? 'primary.main' : 'grey.400',
                    fontSize: '1.5rem'
                  }}
                >
                  {player.nickname?.[0] || <PersonIcon />}
                </PlayerAvatar>

                {/* Player Name */}
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'primary.main' : 'text.primary',
                    mb: 1
                  }}
                >
                  {player.nickname || 'Unknown'}
                </Typography>

                {/* Vote Count */}
                {votes > 0 && (
                  <Chip
                    size="small"
                    label={`${votes}표`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      fontSize: '0.75rem',
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' }
                      }
                    }}
                  />
                )}
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Vote Button */}
      {!isVoted && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<VoteIcon />}
            onClick={handleVoteSubmit}
            disabled={!selectedPlayerId || isLoading}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              ...(selectedPlayerId && {
                background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                  transform: 'translateY(-1px)'
                }
              })
            }}
          >
            {isLoading ? '투표 중...' : '투표하기'}
          </Button>
        </Box>
      )}

      {/* Voted Status */}
      {isVoted && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Chip
            icon={<CheckIcon />}
            label="투표 완료"
            color="success"
            sx={{
              fontSize: '1rem',
              py: 1,
              px: 2,
              fontWeight: 600,
              animation: 'fadeIn 0.5s ease',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'scale(0.8)' },
                '100%': { opacity: 1, transform: 'scale(1)' }
              }
            }}
          />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* Real-time Voting Status */}
      <Card elevation={1} sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          실시간 투표 현황
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {players.map((player) => {
            const voted = hasUserVoted(player.id)
            return (
              <Chip
                key={player.id}
                size="small"
                label={player.nickname || 'Unknown'}
                variant={voted ? 'filled' : 'outlined'}
                color={voted ? 'primary' : 'default'}
                sx={{ 
                  opacity: voted ? 1 : 0.5,
                  transition: 'all 0.3s ease'
                }}
              />
            )
          })}
        </Box>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          투표 확인
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            다음 플레이어에게 투표하시겠습니까?
          </Typography>
          <Card sx={{ p: 2, backgroundColor: 'grey.50', textAlign: 'center' }}>
            <Avatar sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }}>
              {votableePlayers.find(p => p.id === selectedPlayerId)?.nickname?.[0]}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {votableePlayers.find(p => p.id === selectedPlayerId)?.nickname}
            </Typography>
          </Card>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            투표 후에는 변경할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
            sx={{ fontWeight: 600 }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmVote}
            sx={{ fontWeight: 600 }}
          >
            투표
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
})

VotingPhase.displayName = 'VotingPhase'
export default VotingPhase