import React from 'react'
import {motion} from 'framer-motion'
import {Avatar, Box, Paper, Typography} from '@mui/material'

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
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 1,
          alignItems: 'flex-end',
          gap: 1
        }}
      >
        {!isOwn && (
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              background: 'linear-gradient(45deg, #4ECDC4, #44A08D)'
            }}
          >
            {message.nickname?.[0]}
          </Avatar>
        )}
        
        <Box sx={{ maxWidth: '70%' }}>
          {!isOwn && (
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 1, 
                color: 'text.secondary',
                fontWeight: 'bold'
              }}
            >
              {message.nickname}
            </Typography>
          )}
          
          <Paper 
            sx={{
              px: 2, 
              py: 1,
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
              sx={{ 
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