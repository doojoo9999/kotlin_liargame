import React, {useEffect} from 'react'
import Confetti from 'react-confetti'
import {motion} from 'framer-motion'
import {Box, Typography} from '@components/ui'
import {Sparkles, Trophy} from 'lucide-react'

const VictoryAnimation = ({ show, winningTeam, onComplete }) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 5000) // 5초 후 자동 완료
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!show) return null

  const isLiarWin = winningTeam === 'LIAR'
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={200}
        recycle={false}
        colors={isLiarWin ? ['#FF4757', '#FF6B7D', '#FF8E8E'] : ['#5352ED', '#7C7CE8', '#9C9EF0']}
      />
      
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 10,
          duration: 1
        }}
        style={{
          background: isLiarWin 
            ? 'linear-gradient(135deg, #FF4757, #FF6B7D)'
            : 'linear-gradient(135deg, #5352ED, #7C7CE8)',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,0.2)'
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Trophy size={80} color="white" />
        </motion.div>
        
        <Typography 
          variant="h3" 
          sx={{ 
            color: 'white', 
            fontWeight: 'bold', 
            mt: 2,
            mb: 1
          }}
        >
          🎉 {isLiarWin ? '라이어' : '시민'} 승리!
        </Typography>
        
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Sparkles size={24} color="white" />
            <Typography variant="h6" sx={{ color: 'white' }}>
              축하합니다!
            </Typography>
            <Sparkles size={24} color="white" />
          </Box>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default VictoryAnimation