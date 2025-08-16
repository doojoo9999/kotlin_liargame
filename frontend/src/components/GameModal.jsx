import React from 'react'
import {Modal} from '@mantine/core'
import {motion} from 'framer-motion'

const MotionModal = motion.create('div')

export function GameModal({ children, title, opened, onClose, size = 'md', ...props }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size={size}
      styles={{
        content: {
          background: `
            linear-gradient(135deg, 
              rgba(45, 55, 72, 0.95) 0%, 
              rgba(45, 55, 72, 0.90) 50%, 
              rgba(45, 55, 72, 0.85) 100%
            )
          `,
          borderRadius: '24px',
          padding: '48px 40px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 40px rgba(102, 126, 234, 0.1),
            inset 0 0 20px rgba(255, 255, 255, 0.05)
          `,
          position: 'relative',
          overflow: 'hidden'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: 'none',
          padding: '0 0 24px 0'
        },
        title: {
          color: '#ffffff',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
          margin: 0
        },
        close: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        },
        body: {
          padding: 0,
          color: 'white'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)'
        }
      }}
      {...props}
    >
      {/* Neon border effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 'inherit',
          background: `
            linear-gradient(45deg, 
              rgba(102, 126, 234, 0.3), 
              rgba(76, 236, 196, 0.3), 
              rgba(255, 107, 107, 0.3),
              rgba(102, 126, 234, 0.3)
            )
          `,
          backgroundSize: '300% 300%',
          zIndex: -2,
          filter: 'blur(1px)',
          opacity: 0.6
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Inner glow effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: '1px',
          left: '1px',
          right: '1px',
          bottom: '1px',
          borderRadius: 'calc(inherit - 1px)',
          background: `
            linear-gradient(135deg, 
              rgba(45, 55, 72, 0.95) 0%, 
              rgba(45, 55, 72, 0.90) 100%
            )
          `,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: -1
        }}
        animate={{
          boxShadow: [
            'inset 0 0 20px rgba(255, 255, 255, 0.05)',
            'inset 0 0 40px rgba(255, 255, 255, 0.1)',
            'inset 0 0 20px rgba(255, 255, 255, 0.05)'
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content wrapper with animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {children}
      </motion.div>
    </Modal>
  )
}

export default GameModal