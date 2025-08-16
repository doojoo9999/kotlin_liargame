import React from 'react'
import {motion} from 'framer-motion'
import {Box, CircularProgress, Typography} from '@components/ui'
import {AlertTriangle, Clock} from 'lucide-react'
import {useTheme} from '@styles'

const EnhancedGameTimer = ({ 
  gameTimer, 
  maxTime = 60, 
  gameStatus, 
  onTimeExpired,
  size = 140 
}) => {
  const theme = useTheme()
  const progress = (gameTimer / maxTime) * 100
  const isUrgent = gameTimer <= 10
  
  const getTimerColor = () => {
    if (isUrgent) return '#FF4757'
    if (gameTimer <= 30) return '#FF9F43'
    return theme.palette.gameColors?.speaking || '#4ECDC4'
  }

  return (
    <motion.div
      animate={isUrgent ? {
        scale: [1, 1.1, 1],
        rotate: [0, 2, -2, 0]
      } : {}}
      transition={{ 
        duration: 1, 
        repeat: isUrgent ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <Box 
        sx={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* 배경 원 */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{
            color: 'rgba(255,255,255,0.1)',
            position: 'absolute'
          }}
        />
        
        {/* 진행 원 */}
        <CircularProgress
          variant="determinate"
          value={progress}
          size={size}
          thickness={4}
          sx={{
            color: getTimerColor(),
            position: 'absolute',
            transform: 'rotate(-90deg) !important',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        
        {/* 중앙 컨텐츠 */}
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isUrgent ? (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle size={32} color="#FF4757" />
            </motion.div>
          ) : (
            <Clock size={32} color={getTimerColor()} />
          )}
          
          <Typography 
            variant="h4" 
            fontWeight="bold"
            sx={{ 
              color: getTimerColor(),
              mt: 1,
              textShadow: isUrgent ? '0 0 10px rgba(255,71,87,0.5)' : 'none'
            }}
          >
            {gameTimer}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            초 남음
          </Typography>
        </Box>
        
        {/* 긴급 상황 외곽 효과 */}
        {isUrgent && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              width: size + 20,
              height: size + 20,
              border: '3px solid #FF4757',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
        )}
      </Box>
    </motion.div>
  )
}

export default EnhancedGameTimer