import React, {useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {Avatar, Box, Button, Card, CardContent, Grid, Typography} from '@mui/material'
import {Target, Vote} from 'lucide-react'
import {useTheme} from '@mui/material/styles'

const InteractiveVotingSystem = ({ players, onVote, disabled = false }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [isVoting, setIsVoting] = useState(false)
  const theme = useTheme()

  const handlePlayerSelect = (player) => {
    if (disabled) return
    setSelectedPlayer(player)
  }

  const handleVoteSubmit = async () => {
    if (!selectedPlayer) return
    
    setIsVoting(true)
    try {
      await onVote(selectedPlayer.id)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Target size={48} color={theme.palette.gameColors?.voting || '#C44569'} />
        </motion.div>
        
        <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
          🎯 라이어를 찾아주세요!
        </Typography>
        
        <Typography variant="body1" color="text.secondary">
          의심스러운 플레이어에게 투표하세요
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {players.filter(p => p.id !== selectedPlayer?.currentUserId).map((player) => (
          <Grid item xs={6} sm={4} md={3} key={player.id}>
            <motion.div
              whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -5 }}
              whileTap={{ scale: disabled ? 1 : 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card 
                sx={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: selectedPlayer?.id === player.id 
                    ? `3px solid ${theme.palette.accent?.main || '#FFE66D'}` 
                    : `2px solid rgba(255,255,255,0.1)`,
                  background: selectedPlayer?.id === player.id
                    ? `linear-gradient(135deg, ${theme.palette.accent?.main || '#FFE66D'}20, ${theme.palette.accent?.main || '#FFE66D'}10)`
                    : 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  opacity: disabled ? 0.6 : 1,
                  '&:hover': {
                    boxShadow: disabled ? 'none' : '0 8px 25px rgba(255,230,109,0.3)',
                    border: disabled ? undefined : `2px solid ${theme.palette.accent?.main || '#FFE66D'}80`
                  }
                }}
                onClick={() => handlePlayerSelect(player)}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <motion.div
                    animate={selectedPlayer?.id === player.id ? {
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.5, repeat: selectedPlayer?.id === player.id ? Infinity : 0 }}
                  >
                    <Avatar 
                      sx={{ 
                        mx: 'auto', 
                        mb: 1, 
                        width: 60, 
                        height: 60,
                        background: selectedPlayer?.id === player.id 
                          ? `linear-gradient(45deg, ${theme.palette.accent?.main || '#FFE66D'}, ${theme.palette.accent?.light || '#FFEF96'})`
                          : 'linear-gradient(45deg, #666, #888)',
                        border: selectedPlayer?.id === player.id ? '3px solid white' : 'none',
                        boxShadow: selectedPlayer?.id === player.id ? '0 4px 20px rgba(255,230,109,0.4)' : 'none'
                      }}
                    >
                      {player.nickname?.[0]?.toUpperCase()}
                    </Avatar>
                  </motion.div>
                  
                  <Typography 
                    variant="body2" 
                    fontWeight={selectedPlayer?.id === player.id ? 'bold' : 'normal'}
                    sx={{
                      color: selectedPlayer?.id === player.id 
                        ? theme.palette.accent?.main || '#FFE66D'
                        : 'text.primary'
                    }}
                  >
                    {player.nickname}
                  </Typography>
                  
                  {selectedPlayer?.id === player.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Vote size={16} color={theme.palette.accent?.main || '#FFE66D'} style={{ marginTop: 4 }} />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box 
              sx={{ 
                p: 2, 
                mb: 2,
                background: 'rgba(255,230,109,0.1)', 
                borderRadius: 2,
                border: `1px solid ${theme.palette.accent?.main || '#FFE66D'}40`,
                textAlign: 'center'
              }}
            >
              <Typography variant="body1">
                <strong>{selectedPlayer.nickname}</strong>님을 라이어로 지목하시겠습니까?
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={selectedPlayer ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 1, repeat: selectedPlayer ? Infinity : 0 }}
      >
        <Button 
          variant="contained" 
          fullWidth 
          size="large"
          disabled={!selectedPlayer || disabled || isVoting}
          onClick={handleVoteSubmit}
          startIcon={isVoting ? null : <Vote size={20} />}
          sx={{ 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: selectedPlayer 
              ? `linear-gradient(45deg, ${theme.palette.gameColors?.voting || '#C44569'}, #E55C7A)`
              : undefined,
            '&:hover': {
              background: selectedPlayer 
                ? `linear-gradient(45deg, #B73E56, ${theme.palette.gameColors?.voting || '#C44569'})`
                : undefined,
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(196,69,105,0.4)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isVoting ? '투표 중...' : selectedPlayer ? `${selectedPlayer.nickname}님에게 투표하기` : '플레이어를 선택하세요'}
        </Button>
      </motion.div>
    </motion.div>
  )
}

export default InteractiveVotingSystem