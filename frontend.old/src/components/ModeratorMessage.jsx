import React from 'react'
import {Box, Fade, Typography} from '@mui/material'
import {Campaign as CampaignIcon} from '@mui/icons-material'

const ModeratorMessage = ({ message, visible = true }) => {
  return (
    <Fade in={visible} timeout={800}>
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#d32f2f',
          color: 'white',
          padding: '20px 40px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          textAlign: 'center',
          zIndex: 1000,
          minWidth: '300px',
          border: '3px solid #b71c1c'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CampaignIcon sx={{ fontSize: '2rem' }} />
          <Typography variant="h5" fontWeight="bold">
            사회자
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 'medium' }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  )
}

export default ModeratorMessage