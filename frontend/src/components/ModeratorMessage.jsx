import React from 'react'
import {Box, Typography} from '@components/ui'
import {Megaphone as CampaignIcon} from 'lucide-react'

const ModeratorMessage = ({ message, visible = true }) => {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.8s ease-in-out',
      pointerEvents: visible ? 'auto' : 'none'
    }}>
      <Box
        style={{
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
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <CampaignIcon size={32} />
          <Typography variant="h5" style={{ fontWeight: 'bold' }}>
            사회자
          </Typography>
        </Box>
        <Typography variant="h6" style={{ marginTop: '16px', fontWeight: 'medium' }}>
          {message}
        </Typography>
      </Box>
    </div>
  )
}

export default ModeratorMessage