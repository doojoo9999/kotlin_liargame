import React, {useEffect, useState} from 'react'
import {Avatar, Box, Button, Card, Chip, Divider, Grid, Typography} from '@mui/material'
import {
    CheckCircle as SuccessIcon,
    EmojiEvents as TrophyIcon,
    Home as HomeIcon,
    Person as PersonIcon,
    Refresh as RestartIcon
} from '@mui/icons-material'

const GameResult = React.memo(function GameResult({
  finalGameResult,
  players = [],
  currentUser,
  playerRole,
  onRestartGame,
  onNavigateToLobby,
  isMobile = false
}) {
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Parse game result
  const isWinner = finalGameResult?.winner === 'LIAR' 
    ? playerRole === 'LIAR' 
    : playerRole !== 'LIAR'
  
  const winnerTeam = finalGameResult?.winner || 'UNKNOWN'
  const liars = finalGameResult?.liars || []
  const citizens = players.filter(p => !liars.some(l => l.id === p.id))
  
  // Show confetti effect for winners
  useEffect(() => {
    if (isWinner) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isWinner])

  const ConfettiEffect = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle, #FFD700 2px, transparent 2px),
            radial-gradient(circle, #FF6B6B 2px, transparent 2px),
            radial-gradient(circle, #4ECDC4 2px, transparent 2px),
            radial-gradient(circle, #45B7D1 2px, transparent 2px),
            radial-gradient(circle, #96CEB4 2px, transparent 2px),
            radial-gradient(circle, #FFEAA7 2px, transparent 2px)
          `,
          backgroundSize: '50px 50px, 60px 60px, 70px 70px, 80px 80px, 90px 90px, 100px 100px',
          backgroundPosition: '0 0, 10px 10px, 20px 20px, 30px 30px, 40px 40px, 50px 50px',
          animation: 'confetti 3s ease-out infinite',
          '@keyframes confetti': {
            '0%': {
              transform: 'translateY(-100vh) rotate(0deg)',
              opacity: 1
            },
            '100%': {
              transform: 'translateY(100vh) rotate(720deg)',
              opacity: 0
            }
          }
        }
      }}
    />
  )

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', position: 'relative' }}>
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}
      
      {/* Main Result Card */}
      <Card
        elevation={8}
        sx={{
          mb: 4,
          p: 4,
          textAlign: 'center',
          background: isWinner 
            ? 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)' 
            : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
          color: 'white',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideUp 0.8s ease-out',
          '@keyframes slideUp': {
            '0%': { 
              opacity: 0,
              transform: 'translateY(30px)'
            },
            '100%': { 
              opacity: 1,
              transform: 'translateY(0)'
            }
          },
          // Winner glow effect
          ...(isWinner && {
            boxShadow: '0 0 30px rgba(76, 175, 80, 0.5)',
            animation: 'slideUp 0.8s ease-out, glow 2s ease-in-out infinite alternate',
            '@keyframes glow': {
              '0%': { boxShadow: '0 0 30px rgba(76, 175, 80, 0.5)' },
              '100%': { boxShadow: '0 0 40px rgba(76, 175, 80, 0.8)' }
            }
          })
        }}
      >
        {/* Trophy Icon */}
        <TrophyIcon 
          sx={{ 
            fontSize: '4rem', 
            mb: 2,
            filter: isWinner ? 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' : 'none',
            animation: isWinner ? 'bounce 1s ease-in-out infinite alternate' : 'none',
            '@keyframes bounce': {
              '0%': { transform: 'scale(1)' },
              '100%': { transform: 'scale(1.1)' }
            }
          }} 
        />
        
        {/* Result Title */}
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            mb: 2,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontSize: isMobile ? '2rem' : '3rem'
          }}
        >
          {isWinner ? '🎉 승리!' : '😔 패배...'}
        </Typography>
        
        {/* Winner Team */}
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            mb: 1,
            opacity: 0.9 
          }}
        >
          {winnerTeam === 'LIAR' ? '🎭 라이어팀 승리' : '👥 시민팀 승리'}
        </Typography>
        
        {/* Your Role */}
        <Chip
          label={playerRole === 'LIAR' ? '🎭 라이어' : '👥 시민'}
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            py: 1,
            px: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        />
      </Card>

      {/* Team Results */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Liar Team */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: winnerTeam === 'LIAR' ? 'success.light' : 'error.light',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                🎭 라이어팀
              </Typography>
              {winnerTeam === 'LIAR' && (
                <SuccessIcon sx={{ color: 'success.main' }} />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {liars.map((liar) => (
                <Box 
                  key={liar.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {liar.nickname?.[0] || <PersonIcon />}
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {liar.nickname}
                    {liar.id === currentUser?.id && ' (나)'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Citizen Team */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={2} 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: winnerTeam === 'CITIZEN' ? 'success.light' : 'error.light',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                👥 시민팀
              </Typography>
              {winnerTeam === 'CITIZEN' && (
                <SuccessIcon sx={{ color: 'success.main' }} />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {citizens.map((citizen) => (
                <Box 
                  key={citizen.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      fontSize: '0.9rem'
                    }}
                  >
                    {citizen.nickname?.[0] || <PersonIcon />}
                  </Avatar>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {citizen.nickname}
                    {citizen.id === currentUser?.id && ' (나)'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Game Summary */}
      {finalGameResult?.reason && (
        <Card elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'grey.50', borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📋 게임 결과 요약
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            {finalGameResult.reason}
          </Typography>
        </Card>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<RestartIcon />}
          onClick={onRestartGame}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          다시 게임하기
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<HomeIcon />}
          onClick={onNavigateToLobby}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 2,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)'
            }
          }}
        >
          로비로 이동
        </Button>
      </Box>

      {/* Celebration Message */}
      {isWinner && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: 'success.main',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.7 },
                '50%': { opacity: 1 }
              }
            }}
          >
            🎊 축하합니다! 훌륭한 게임이었습니다! 🎊
          </Typography>
        </Box>
      )}
    </Box>
  )
})

GameResult.displayName = 'GameResult'
export default GameResult