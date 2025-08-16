import React, {useEffect, useState} from 'react'
import {Box, Button, Card, CardContent, Chip, Paper, Typography} from '../ui'
import {CheckCircle as CheckIcon, Timer as TimerIcon, Vote as VoteIcon} from 'lucide-react'
import {useGame} from '../context/GameContext'

const VotingComponent = ({ 
  players = [], 
  gameTimer = 60, 
  gameNumber,
  onVoteComplete = () => {} 
}) => {
  const { castVote, currentUser, state } = useGame()
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get voting progress from context
  const votingProgress = state.votingProgress || { voted: 0, total: players.length }
  const myVote = state.myVote

  // Update hasVoted when myVote changes
  useEffect(() => {
    setHasVoted(!!myVote)
    if (myVote) {
      setSelectedPlayer(players.find(p => p.id === myVote) || null)
    }
  }, [myVote, players])

  // Handle player selection
  const handlePlayerSelect = (player) => {
    if (hasVoted || player.id === currentUser?.id || isSubmitting) return
    
    // Toggle selection
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null)
    } else {
      setSelectedPlayer(player)
    }
  }

  // Handle vote confirmation
  const handleVoteConfirm = async () => {
    if (!selectedPlayer || hasVoted || isSubmitting) return

    setIsSubmitting(true)
    try {
      await castVote(gameNumber, selectedPlayer.id)
      setHasVoted(true)
      onVoteComplete(selectedPlayer.id)
    } catch (error) {
      console.error('Failed to cast vote:', error)
      // Error is handled in context, just reset submitting state
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Filter out current user from voting options
  const votableePlayers = players.filter(player => player.id !== currentUser?.id)

  // Calculate grid layout based on player count
  const getGridSize = (playerCount) => {
    if (playerCount <= 2) return 12 // 1 column
    if (playerCount <= 4) return 6  // 2 columns
    if (playerCount <= 6) return 4  // 3 columns
    return 3 // 4 columns for more players
  }

  const gridSize = getGridSize(votableePlayers.length)

  return (
    <Paper style={{ padding: '24px', backgroundColor: '#fff3e0', borderRadius: '24px' }}>
      {/* Voting Header */}
      <Box $textAlign="center" $marginBottom="24px">
        <Typography variant="h4" style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '16px' }}>
          🗳️ 라이어를 지목해 주세요
        </Typography>
        
        {/* Timer */}
        <Box $display="flex" $alignItems="center" $justifyContent="center" $gap="16px" $marginBottom="16px">
          <TimerIcon size={24} style={{ color: '#f44336' }} />
          <Typography variant="h5" style={{ color: '#f44336', fontWeight: 'bold' }}>
            {formatTime(gameTimer)}
          </Typography>
        </Box>

        {/* Progress Bar */}
        <Box
          style={{
            width: '100%',
            height: '10px', 
            borderRadius: '5px',
            backgroundColor: 'rgba(255,255,255,0.5)',
            marginBottom: '8px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            style={{
              height: '100%',
              width: `${(votingProgress.voted / votingProgress.total) * 100}%`,
              backgroundColor: '#4caf50',
              borderRadius: '5px',
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </Box>
        
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          투표 완료: {votingProgress.voted} / {votingProgress.total}명
        </Typography>
      </Box>

      {/* Player Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {votableePlayers.map((player) => (
          <Grid item xs={gridSize} key={player.id}>
            <Card
              sx={{
                cursor: hasVoted ? 'default' : 'pointer',
                border: selectedPlayer?.id === player.id ? '3px solid #ff9800' : '1px solid #ddd',
                bgcolor: hasVoted ? 'grey.200' : 'white',
                opacity: hasVoted ? 0.7 : 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: !hasVoted ? 'translateY(-4px)' : 'none',
                  boxShadow: !hasVoted ? '0 8px 24px rgba(0,0,0,0.15)' : 'none'
                }
              }}
              onClick={() => handlePlayerSelect(player)}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Avatar
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    mx: 'auto', 
                    mb: 1,
                    bgcolor: `hsl(${player.id * 30}, 70%, 50%)`
                  }}
                >
                  {player.nickname?.charAt(0) || '?'}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  {player.nickname}
                </Typography>
                
                {selectedPlayer?.id === player.id && !hasVoted && (
                  <Chip 
                    label="선택됨" 
                    color="warning" 
                    size="small"
                  />
                )}

                {myVote === player.id && (
                  <Chip 
                    icon={<CheckIcon />}
                    label="투표함" 
                    color="success" 
                    size="small"
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Vote Confirmation Button */}
      {!hasVoted && (
        <Fade in={!!selectedPlayer}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<VoteIcon />}
              onClick={handleVoteConfirm}
              disabled={!selectedPlayer || isSubmitting}
              sx={{ 
                px: 4, 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? '투표 중...' : '투표 확정'}
            </Button>
          </Box>
        </Fade>
      )}

      {/* Vote Complete Message */}
      {hasVoted && (
        <Box sx={{ textAlign: 'center' }}>
          <Chip 
            icon={<CheckIcon />}
            label="투표 완료! 다른 플레이어들을 기다리는 중..."
            color="success"
            variant="outlined"
            sx={{ px: 2, py: 1, fontSize: '1rem' }}
          />
        </Box>
      )}
    </Paper>
  )
}

export default VotingComponent