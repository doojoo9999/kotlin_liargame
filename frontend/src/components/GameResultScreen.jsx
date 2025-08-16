import React, {useEffect, useState} from 'react'
import {Box, Button, Card, CardContent, Chip, Divider, Grid, Paper, Typography} from '@components/ui'
import {
    Brain as LiarIcon,
    Home as HomeIcon,
    RotateCcw as RestartIcon,
    Trophy as TrophyIcon,
    Users as CitizenIcon
} from 'lucide-react'
import {useTheme} from '@styles'
import {useResponsiveLayout} from '../hooks/useGameLayout'
import styled from 'styled-components'

// Animation keyframes using styled-components
const revealAnimation = `
  0% {
    transform: rotateY(0deg);
    background: linear-gradient(45deg, #2196F3, #21CBF3);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
    background: linear-gradient(45deg, #f44336, #ff9800);
  }
`

const sparkleAnimation = `
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
`

// Styled components for animations
const FadeWrapper = styled.div`
  opacity: ${props => props.$show ? 1 : 0};
  transform: translateY(${props => props.$show ? 0 : '20px'});
  transition: all 0.3s ease-in-out;
`

const SlideWrapper = styled.div`
  transform: translateX(${props => props.$show ? 0 : '100%'});
  transition: transform 0.3s ease-in-out;
`

const ZoomWrapper = styled.div`
  transform: scale(${props => props.$show ? 1 : 0.8});
  opacity: ${props => props.$show ? 1 : 0};
  transition: all 0.3s ease-in-out;
`

// Main layout styled components
const FullscreenOverlay = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${props => props.$isMobile ? '8px' : '16px'};
`

const ResultPaper = styled(Paper)`
  max-width: ${props => props.$isMobile ? '100%' : '800px'};
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`

const ContentContainer = styled(Box)`
  padding: ${props => props.$isMobile ? '8px' : '16px'};
`

const SparkleBox = styled(Box)`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  width: 8px;
  height: 8px;
  background: gold;
  border-radius: 50%;
  animation: sparkleAnimation 2s infinite;
  animation-delay: ${props => props.$delay}s;
  
  @keyframes sparkleAnimation {
    ${sparkleAnimation}
  }
`

const AnimatedAvatarContainer = styled(Box)`
  display: inline-block;
  animation: ${props => props.$showAnimation ? `revealAnimation 2s ease-in-out` : 'none'};
  border-radius: 50%;
  padding: 4px;
  
  @keyframes revealAnimation {
    ${revealAnimation}
  }
`

const GameResultScreen = ({
  gameResult,
  players = [],
  liarPlayer,
  winningTeam, // 'LIAR' or 'CITIZENS'
  gameStats,
  onRestartGame,
  onReturnToLobby,
  showAnimation = true
}) => {
  const theme = useTheme()
  const { isMobile } = useResponsiveLayout()
  
  const [showLiarReveal, setShowLiarReveal] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    if (showAnimation) {
      // Sequence the animations
      const timer1 = setTimeout(() => setShowLiarReveal(true), 500)
      const timer2 = setTimeout(() => setShowResults(true), 2500)
      const timer3 = setTimeout(() => setShowActions(true), 3500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    } else {
      setShowLiarReveal(true)
      setShowResults(true)
      setShowActions(true)
    }
  }, [showAnimation])

  const getResultColor = () => {
    return winningTeam === 'LIAR' ? 'error' : 'success'
  }

  const getResultIcon = () => {
    return winningTeam === 'LIAR' ? <LiarIcon /> : <CitizenIcon />
  }

  const getResultMessage = () => {
    if (winningTeam === 'LIAR') {
      return '🎭 라이어 승리!'
    } else {
      return '👥 시민 승리!'
    }
  }

  const getPlayerResultChip = (player) => {
    const isLiar = player.id === liarPlayer?.id
    const isWinner = (isLiar && winningTeam === 'LIAR') || (!isLiar && winningTeam === 'CITIZENS')
    
    return (
      <Chip
        icon={isLiar ? <LiarIcon /> : <CitizenIcon />}
        label={isLiar ? '라이어' : '시민'}
        color={isWinner ? 'success' : 'default'}
        variant={isWinner ? 'filled' : 'outlined'}
        size="small"
      />
    )
  }

  return (
    <FullscreenOverlay $isMobile={isMobile}>
      <ResultPaper $isMobile={isMobile}>
        {/* Sparkle Effects */}
        {showLiarReveal && (
          <>
            {[...Array(6)].map((_, i) => (
              <SparkleBox
                key={i}
                $top={20 + i * 15}
                $left={10 + i * 15}
                $delay={i * 0.3}
              />
            ))}
          </>
        )}

        <ContentContainer $isMobile={isMobile}>
          {/* Game Over Title */}
          <Fade in timeout={1000}>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              align="center"
              sx={{
                fontWeight: 'bold',
                mb: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              🎮 게임 종료
            </Typography>
          </Fade>

          {/* Liar Reveal Animation */}
          {liarPlayer && (
            <Slide direction="up" in={showLiarReveal} timeout={1000}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                  라이어 공개!
                </Typography>
                
                <Box
                  sx={{
                    display: 'inline-block',
                    animation: showAnimation ? `${revealAnimation} 2s ease-in-out` : 'none',
                    borderRadius: '50%',
                    p: 1
                  }}
                >
                  <Avatar
                    sx={{
                      width: isMobile ? 80 : 120,
                      height: isMobile ? 80 : 120,
                      bgcolor: 'error.main',
                      fontSize: isMobile ? '2rem' : '3rem',
                      fontWeight: 'bold',
                      border: '4px solid white',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}
                  >
                    {liarPlayer.nickname?.charAt(0) || '?'}
                  </Avatar>
                </Box>
                
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {liarPlayer.nickname}
                </Typography>
                <Chip
                  icon={<LiarIcon />}
                  label="라이어"
                  color="error"
                  sx={{ mt: 1, color: 'white', fontWeight: 'bold' }}
                />
              </Box>
            </Slide>
          )}

          {/* Game Result */}
          <Zoom in={showResults} timeout={1000}>
            <Card
              sx={{
                mb: 3,
                bgcolor: `${getResultColor()}.main`,
                color: 'white'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                  <TrophyIcon sx={{ fontSize: isMobile ? 40 : 60 }} />
                  <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight="bold">
                    {getResultMessage()}
                  </Typography>
                </Box>
                
                {gameStats && (
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    게임 시간: {gameStats.duration || '알 수 없음'} | 
                    라운드: {gameStats.rounds || 1}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Zoom>

          {/* Player Results */}
          <Fade in={showResults} timeout={1500}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                플레이어 결과
              </Typography>
              
              <Grid container spacing={2}>
                {players.map((player, index) => (
                  <Grid item xs={12} sm={6} md={4} key={player.id}>
                    <Slide
                      direction="up"
                      in={showResults}
                      timeout={1000}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <Card
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Avatar
                            sx={{
                              width: 50,
                              height: 50,
                              mx: 'auto',
                              mb: 1,
                              bgcolor: `hsl(${player.id * 30}, 70%, 50%)`
                            }}
                          >
                            {player.nickname?.charAt(0) || '?'}
                          </Avatar>
                          
                          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                            {player.nickname}
                          </Typography>
                          
                          {getPlayerResultChip(player)}
                          
                          {player.score !== undefined && (
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                              점수: {player.score}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Slide>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>

          {/* Action Buttons */}
          <Fade in={showActions} timeout={1000}>
            <Box sx={{ textAlign: 'center' }}>
              <Divider sx={{ my: 3, bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
              
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'center',
                  flexDirection: isMobile ? 'column' : 'row'
                }}
              >
                {onRestartGame && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<RestartIcon />}
                    onClick={onRestartGame}
                    sx={{
                      bgcolor: 'success.main',
                      '&:hover': { bgcolor: 'success.dark' },
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    다시 게임하기
                  </Button>
                )}
                
                {onReturnToLobby && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<HomeIcon />}
                    onClick={onReturnToLobby}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      },
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    로비로 돌아가기
                  </Button>
                )}
              </Box>
            </Box>
          </Fade>
        </ContentContainer>
      </ResultPaper>
    </FullscreenOverlay>
  )
}

export default GameResultScreen