import React from 'react'
import {Avatar, Box, Card} from '@mui/material'
import TypewriterText from './TypewriterText.jsx'

const MESSAGE_CONFIGS = {
  info: {
    background: '#f0f9ff',      // Light blue
    borderColor: '#1976d2',
    iconColor: '#1976d2',
    textColor: '#1565c0',
    icons: ['🎮', '📝', '🗣️']
  },
  warning: {
    background: '#fef3c7',      // Light orange
    borderColor: '#f57c00',
    iconColor: '#ef6c00',
    textColor: '#e65100',
    icons: ['⚠️', '⏰', '🚨']
  },
  celebration: {
    background: '#f0f9ff',      // Light green for victory, light red for defeat
    borderColor: '#4caf50',
    iconColor: '#388e3c',
    textColor: '#2e7d32',
    icons: ['🎉', '💔', '👑']
  }
}

const NarratorBubble = React.memo(function NarratorBubble({
  message,
  category = 'info',
  icon,
  effects = [],
  onComplete,
  onSkip,
  showAvatar = true,
  position = 'left',
  variant = 'body1',
  clickToSkip = true,
  isMobile = false,
  sx = {}
}) {
  const config = MESSAGE_CONFIGS[category] || MESSAGE_CONFIGS.info
  
  // Select icon - use provided icon or random from category
  const selectedIcon = icon || config.icons[Math.floor(Math.random() * config.icons.length)]
  
  // Determine bubble background based on category and effects
  const getBubbleStyle = () => {
    let background = config.background
    let borderColor = config.borderColor
    
    // Special styling for celebration messages
    if (category === 'celebration') {
      if (effects.includes('victory')) {
        background = '#f1f8e9' // Light green
        borderColor = '#4caf50'
      } else if (effects.includes('defeat')) {
        background = '#ffebee' // Light red  
        borderColor = '#f44336'
      }
    }
    
    return {
      background,
      borderColor,
      boxShadow: `0 4px 12px ${borderColor}22`
    }
  }

  const bubbleStyle = getBubbleStyle()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 2,
        ...(position === 'right' && {
          flexDirection: 'row-reverse'
        }),
        // Animation entrance
        animation: 'slideInBubble 0.5s ease-out',
        '@keyframes slideInBubble': {
          '0%': {
            opacity: 0,
            transform: position === 'left' ? 'translateX(-20px)' : 'translateX(20px)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateX(0)'
          }
        },
        ...sx
      }}
    >
      {/* Narrator Avatar */}
      {showAvatar && (
        <Avatar
          sx={{
            width: isMobile ? 40 : 48,
            height: isMobile ? 40 : 48,
            backgroundColor: config.iconColor,
            fontSize: isMobile ? '1.2rem' : '1.4rem',
            flexShrink: 0,
            // Pulse effect for important messages
            ...(category === 'warning' && {
              animation: 'avatarPulse 2s ease-in-out infinite',
              '@keyframes avatarPulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.1)' }
              }
            })
          }}
        >
          {selectedIcon}
        </Avatar>
      )}

      {/* Message Bubble */}
      <Box
        sx={{
          position: 'relative',
          maxWidth: isMobile ? '280px' : '400px',
          flexGrow: 1
        }}
      >
        <Card
          elevation={2}
          sx={{
            p: isMobile ? 2 : 3,
            borderRadius: 3,
            backgroundColor: bubbleStyle.background,
            border: `2px solid ${bubbleStyle.borderColor}`,
            boxShadow: bubbleStyle.boxShadow,
            position: 'relative',
            // Speech bubble tail
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 20,
              ...(position === 'left' ? {
                left: -10,
                borderTop: `10px solid ${bubbleStyle.borderColor}`,
                borderRight: '10px solid transparent',
                borderBottom: '10px solid transparent'
              } : {
                right: -10,
                borderTop: `10px solid ${bubbleStyle.borderColor}`,
                borderLeft: '10px solid transparent',  
                borderBottom: '10px solid transparent'
              })
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 22,
              ...(position === 'left' ? {
                left: -7,
                borderTop: `8px solid ${bubbleStyle.background}`,
                borderRight: '8px solid transparent',
                borderBottom: '8px solid transparent'
              } : {
                right: -7,
                borderTop: `8px solid ${bubbleStyle.background}`,
                borderLeft: '8px solid transparent',
                borderBottom: '8px solid transparent'
              })
            },
            // Hover effect
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 16px ${bubbleStyle.borderColor}33`
            },
            // Special effects
            ...(effects.includes('sparkle') && {
              '&::before': {
                ...this['&::before'],
                animation: 'sparkle 2s ease-in-out infinite',
                '@keyframes sparkle': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 }
                }
              }
            }),
            ...(effects.includes('pulse') && {
              animation: 'bubblePulse 1.5s ease-in-out infinite',
              '@keyframes bubblePulse': {
                '0%, 100%': { 
                  borderColor: bubbleStyle.borderColor,
                  transform: 'scale(1)'
                },
                '50%': { 
                  borderColor: config.iconColor,
                  transform: 'scale(1.02)'
                }
              }
            })
          }}
        >
          <TypewriterText
            text={message}
            category={category}
            onComplete={onComplete}
            onSkip={onSkip}
            variant={variant}
            clickToSkip={clickToSkip}
            sx={{
              color: config.textColor,
              fontWeight: category === 'warning' ? 600 : 400,
              lineHeight: 1.6
            }}
          />
        </Card>

        {/* Priority Indicator for Important Messages */}
        {category === 'warning' && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: '#f44336',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              animation: 'priorityBlink 1s ease-in-out infinite',
              '@keyframes priorityBlink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.6 }
              }
            }}
          >
            !
          </Box>
        )}

        {/* Celebration Confetti Effect */}
        {category === 'celebration' && effects.includes('confetti') && (
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              pointerEvents: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: `
                  radial-gradient(circle, #FFD700 1px, transparent 1px),
                  radial-gradient(circle, #FF6B6B 1px, transparent 1px),
                  radial-gradient(circle, #4ECDC4 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px, 25px 25px, 30px 30px',
                backgroundPosition: '0 0, 5px 5px, 10px 10px',
                animation: 'miniConfetti 3s linear infinite',
                '@keyframes miniConfetti': {
                  '0%': {
                    transform: 'translateY(-10px) rotate(0deg)',
                    opacity: 0.8
                  },
                  '100%': {
                    transform: 'translateY(50px) rotate(180deg)',
                    opacity: 0
                  }
                }
              }
            }}
          />
        )}
      </Box>
    </Box>
  )
})

NarratorBubble.displayName = 'NarratorBubble'
export default NarratorBubble