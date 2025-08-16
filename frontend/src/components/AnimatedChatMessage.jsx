import React from 'react'
import {motion} from 'framer-motion'
import {Box, Paper, PlayerAvatar as Avatar, Typography} from '@components/ui'

const AnimatedChatMessage = ({ message, isOwn, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        type: "spring",
        stiffness: 300
      }}
      whileHover={{ scale: 1.02 }}
    >
      <Box 
        style={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          marginBottom: '8px',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        {!isOwn && (
          <Avatar 
            nickname={message.nickname}
            style={{ 
              width: '32px', 
              height: '32px',
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)'
            }}
          />
        )}
        
        <Box style={{ maxWidth: '70%' }}>
          {!isOwn && (
            <Typography 
              variant="caption" 
              style={{ 
                marginLeft: '8px', 
                color: '#666666',
                fontWeight: 'bold'
              }}
            >
              {message.nickname}
            </Typography>
          )}
          
          <Paper 
            style={{
              padding: '8px 16px',
              background: isOwn 
                ? 'linear-gradient(45deg, #FF6B6B, #FF8E8E)'
                : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: isOwn 
                ? '20px 20px 4px 20px' 
                : '20px 20px 20px 4px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}
          >
            <Typography 
              variant="body2" 
              style={{ 
                color: 'white',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Typography>
          </Paper>
        </Box>
      </Box>
    </motion.div>
  )
}

export default AnimatedChatMessage