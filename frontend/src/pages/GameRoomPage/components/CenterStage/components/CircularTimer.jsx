import React, {useMemo} from 'react'
import {Box, CircularProgress, Typography} from '@components/ui'
import {Clock as TimeIcon} from 'lucide-react'

const CircularTimer = React.memo(function CircularTimer({
  timeRemaining = 0,
  maxTime = 60,
  size = 120,
  strokeWidth = 8,
  showIcon = true,
  showText = true,
  onTimeExpired,
  isMobile = false
}) {
  // Calculate progress percentage
  const progress = maxTime > 0 ? ((maxTime - timeRemaining) / maxTime) * 100 : 0
  const timeProgress = maxTime > 0 ? (timeRemaining / maxTime) * 100 : 0
  
  // Determine color based on time remaining percentage
  const { color, backgroundColor, pulseEffect } = useMemo(() => {
    if (timeProgress > 50) {
      // Green zone (50-100%)
      return {
        color: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        pulseEffect: false
      }
    } else if (timeProgress > 20) {
      // Yellow zone (20-50%)
      return {
        color: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        pulseEffect: false
      }
    } else {
      // Red zone (0-20%) with pulse effect
      return {
        color: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        pulseEffect: timeRemaining <= 10
      }
    }
  }, [timeProgress, timeRemaining])

  // Format time display
  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Responsive sizing
  const responsiveSize = isMobile ? Math.min(size, 100) : size
  const responsiveStrokeWidth = isMobile ? Math.max(strokeWidth - 2, 4) : strokeWidth
  const iconSize = responsiveSize * 0.25
  const fontSize = responsiveSize > 100 ? '1.25rem' : '1rem'

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(pulseEffect && {
          animation: 'pulse 1s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { 
              transform: 'scale(1)',
              boxShadow: `0 0 0 0 ${color}33`
            },
            '50%': { 
              transform: 'scale(1.05)',
              boxShadow: `0 0 0 10px ${color}22`
            },
            '100%': { 
              transform: 'scale(1)',
              boxShadow: `0 0 0 0 ${color}00`
            }
          }
        })
      }}
    >
      {/* Background Circle */}
      <Box
        sx={{
          position: 'absolute',
          width: responsiveSize,
          height: responsiveSize,
          borderRadius: '50%',
          backgroundColor: backgroundColor,
          transition: 'background-color 0.3s ease'
        }}
      />
      
      {/* Progress Circle */}
      <CircularProgress
        variant="determinate"
        value={progress}
        size={responsiveSize}
        thickness={(responsiveStrokeWidth / responsiveSize) * 100 / 2}
        sx={{
          color: color,
          transition: 'color 0.3s ease',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
            transition: 'stroke 0.3s ease'
          }
        }}
      />
      
      {/* Content Container */}
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: responsiveSize * 0.7,
          height: responsiveSize * 0.7
        }}
      >
        {showIcon && (
          <TimeIcon 
            sx={{ 
              fontSize: iconSize,
              color: color,
              mb: 0.5,
              transition: 'color 0.3s ease',
              ...(pulseEffect && {
                animation: 'iconPulse 0.5s ease-in-out infinite alternate',
                '@keyframes iconPulse': {
                  '0%': { transform: 'scale(1)' },
                  '100%': { transform: 'scale(1.1)' }
                }
              })
            }} 
          />
        )}
        
        {showText && (
          <Typography
            variant="h6"
            sx={{
              fontSize: fontSize,
              fontWeight: 700,
              color: color,
              textAlign: 'center',
              lineHeight: 1,
              transition: 'color 0.3s ease',
              ...(pulseEffect && {
                animation: 'textBlink 1s ease-in-out infinite',
                '@keyframes textBlink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 }
                }
              })
            }}
          >
            {formatTime(timeRemaining)}
          </Typography>
        )}
        
        {/* Warning indicator for last 10 seconds */}
        {timeRemaining <= 10 && timeRemaining > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#f44336',
              animation: 'warningBlink 0.5s ease-in-out infinite',
              '@keyframes warningBlink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 }
              }
            }}
          />
        )}
      </Box>
      
      {/* Danger Ring Effect for Critical Time */}
      {timeRemaining <= 5 && timeRemaining > 0 && (
        <Box
          sx={{
            position: 'absolute',
            width: responsiveSize + 20,
            height: responsiveSize + 20,
            borderRadius: '50%',
            border: '2px solid #f44336',
            opacity: 0.6,
            animation: 'dangerRing 0.8s ease-in-out infinite',
            '@keyframes dangerRing': {
              '0%': { 
                transform: 'scale(1)',
                opacity: 0.6
              },
              '50%': { 
                transform: 'scale(1.1)',
                opacity: 0.3
              },
              '100%': { 
                transform: 'scale(1)',
                opacity: 0.6
              }
            }
          }}
        />
      )}
      
      {/* Time Expired Overlay */}
      {timeRemaining <= 0 && (
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#f44336',
              fontWeight: 600,
              fontSize: '0.75rem',
              textAlign: 'center',
              animation: 'fadeIn 0.5s ease-in-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 }
              }
            }}
          >
            시간<br />만료
          </Typography>
        </Box>
      )}
    </Box>
  )
})

CircularTimer.displayName = 'CircularTimer'
export default CircularTimer