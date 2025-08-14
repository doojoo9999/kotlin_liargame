import React from 'react'
import {motion} from 'framer-motion'
import {Box, Paper, Typography} from '@mui/material'
import {MessageCircle, Shield, Timer, Vote} from 'lucide-react'

const GameModerator = ({ gameStatus, currentPlayer, timer }) => {
  const getModeratorConfig = () => {
    switch(gameStatus) {
      case 'SPEAKING':
        return {
          message: `🎤 ${currentPlayer?.nickname}님의 발언 차례입니다!`,
          icon: <MessageCircle size={24} />,
          color: '#FF9F43'
        }
      case 'VOTING':
        return {
          message: `🗳️ 라이어를 찾아 투표하세요!`,
          icon: <Vote size={24} />,
          color: '#C44569'
        }
      case 'DEFENSE':
        return {
          message: `⚖️ 변론의 시간입니다!`,
          icon: <Shield size={24} />,
          color: '#5352ED'
        }
      default:
        return {
          message: `🎮 게임을 시작합니다!`,
          icon: null,
          color: '#7FB069'
        }
    }
  }

  const config = getModeratorConfig()

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Paper 
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${config.color}20 0%, ${config.color}10 100%)`,
          backdropFilter: 'blur(15px)',
          border: `1px solid ${config.color}40`,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* 배경 애니메이션 */}
        <motion.div
          animate={{ 
            x: [-100, 100, -100],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)`,
            pointerEvents: 'none'
          }}
        />
        
        <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
          {config.icon && (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: config.color }}
            >
              {config.icon}
            </motion.div>
          )}
          
          <Typography variant="h5" fontWeight="bold" sx={{ color: config.color }}>
            {config.message}
          </Typography>
        </Box>
        
        {timer > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
              <Timer size={20} color={config.color} />
              <Typography variant="h6" sx={{ color: config.color }}>
                {timer}초 남음
              </Typography>
            </Box>
          </motion.div>
        )}
      </Paper>
    </motion.div>
  )
}

export default GameModerator