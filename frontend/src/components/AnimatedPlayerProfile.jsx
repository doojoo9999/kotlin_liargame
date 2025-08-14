import React from 'react'
import {motion} from 'framer-motion'
import {Avatar, Box, Typography} from '@mui/material'
import {Crown, Mic} from 'lucide-react'

const AnimatedPlayerProfile = ({ 
  player, 
  isCurrentTurn, 
  playerRole,
  size = 80 
}) => {
  return (
    <motion.div
      animate={{
        scale: isCurrentTurn ? 1.1 : 1,
        rotate: isCurrentTurn ? [0, -2, 2, 0] : 0
      }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      <Box sx={{ position: 'relative', textAlign: 'center' }}>
        <Avatar
          sx={{
            width: size, 
            height: size,
            border: `4px solid ${isCurrentTurn ? '#FFE66D' : 'transparent'}`,
            background: playerRole === 'LIAR' 
              ? 'linear-gradient(45deg, #FF4757, #FF6B7D)'
              : 'linear-gradient(45deg, #5352ED, #7C7CE8)',
            boxShadow: isCurrentTurn 
              ? '0 0 20px rgba(255,230,109,0.6)' 
              : '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          {player.nickname?.[0]?.toUpperCase()}
        </Avatar>
        
        {/* 턴 표시 애니메이션 */}
        {isCurrentTurn && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            style={{
              position: 'absolute',
              top: -5, 
              right: -5,
              width: 28, 
              height: 28,
              background: '#FFE66D',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(255,230,109,0.4)'
            }}
          >
            <Mic size={14} color="#333" />
          </motion.div>
        )}
        
        {/* 호스트 표시 */}
        {player.isHost && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: -5,
              left: -5,
              width: 24,
              height: 24,
              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Crown size={12} color="#333" />
          </motion.div>
        )}
        
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 1,
            fontWeight: isCurrentTurn ? 'bold' : 'normal',
            color: isCurrentTurn ? '#FFE66D' : 'text.primary'
          }}
        >
          {player.nickname}
        </Typography>
      </Box>
    </motion.div>
  )
}

export default AnimatedPlayerProfile