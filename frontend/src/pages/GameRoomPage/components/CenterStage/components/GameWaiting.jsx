import React from 'react'
import {Box, Button, Paper, Typography} from '@components/ui'
import {Play as PlayIcon} from 'lucide-react'

const GameWaiting = React.memo(function GameWaiting({
  isHost,
  onStartGame,
  isMobile = false
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        width: '100%',
        minHeight: '300px',
        position: 'relative',
        // Background pattern effect
        background: `
          radial-gradient(circle at 20% 50%, rgba(25, 118, 210, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(156, 39, 176, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%)
        `,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255, 255, 255, 0.02) 20px,
              rgba(255, 255, 255, 0.02) 40px
            )
          `,
          borderRadius: 2,
          zIndex: 0
        }
      }}
    >
      {/* Content container with higher z-index */}
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* Descriptive text */}
        <Typography
          variant="h6"
          sx={{
            mb: 3,
            color: 'text.secondary',
            fontWeight: 500,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.7 },
              '50%': { opacity: 1 }
            }
          }}
        >
          {isHost 
            ? '게임을 시작하려면 아래 버튼을 클릭하세요!'
            : '방장이 게임을 시작할 때까지 기다려주세요'
          }
        </Typography>

        {/* Game start button for host */}
        {isHost && (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayIcon />}
            onClick={onStartGame}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: 3,
              // Gradient background as specified (180x60px approximated with padding)
              background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 50%, #A5D6A7 100%)',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 50%, #81C784 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)'
              },
              '&:active': {
                transform: 'translateY(0px)',
                boxShadow: '0 6px 24px rgba(76, 175, 80, 0.3)'
              },
              // Animation for attention
              animation: 'glow 3s ease-in-out infinite',
              '@keyframes glow': {
                '0%, 100%': { 
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)' 
                },
                '50%': { 
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.5)' 
                }
              }
            }}
          >
            게임 시작
          </Button>
        )}

        {/* Waiting animation for non-host players */}
        {!isHost && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: 'primary.light',
              animation: 'breathe 3s ease-in-out infinite',
              '@keyframes breathe': {
                '0%, 100%': { 
                  transform: 'scale(1)',
                  borderColor: 'primary.light' 
                },
                '50%': { 
                  transform: 'scale(1.02)',
                  borderColor: 'primary.main'
                }
              }
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'primary.main',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'blink 1.5s ease-in-out infinite',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 0.3 },
                    '50%': { opacity: 1 }
                  }
                }}
              />
              대기 중...
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'blink 1.5s ease-in-out infinite 0.5s',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 0.3 },
                    '50%': { opacity: 1 }
                  }
                }}
              />
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  )
})

GameWaiting.displayName = 'GameWaiting'
export default GameWaiting