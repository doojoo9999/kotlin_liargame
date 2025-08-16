import React, {useState} from 'react'
import {Button} from '@mantine/core'
import {motion} from 'framer-motion'

const MotionButton = motion.create(Button)

export function GamingButton({ 
  children, 
  leftSection, 
  disabled, 
  onClick, 
  variant = 'gaming',
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = (e) => {
    if (!disabled) {
      // Trigger vibration on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      onClick?.(e)
    }
  }

  // Ripple effect particles on hover
  const RippleParticles = () => {
    if (!isHovered || disabled) return null
    
    return (
      <>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`ripple-${i}`}
            style={{
              position: 'absolute',
              width: '3px',
              height: '3px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              left: `${20 + i * 12}%`,
              top: '50%',
              transform: 'translateY(-50%)',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
              pointerEvents: 'none'
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
              y: [0, -8, 0]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </>
    )
  }

  return (
    <motion.div
      style={{ position: 'relative', display: 'inline-block' }}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
    >
      {/* Glow background effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '8px',
          background: disabled ? 
            'rgba(100, 100, 100, 0.2)' :
            'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7, #fab1a0, #fd79a8, #e17055)',
          backgroundSize: '400% 400%',
          filter: 'blur(8px)',
          opacity: isHovered && !disabled ? 0.8 : 0.3,
          zIndex: -1
        }}
        animate={{
          backgroundPosition: disabled ? 
            '0% 50%' : 
            ['0% 50%', '100% 50%', '0% 50%']
        }}
        transition={{
          duration: disabled ? 0 : 3,
          repeat: disabled ? 0 : Infinity,
          ease: "linear"
        }}
      />

      {/* Main Button */}
      <MotionButton
        onClick={handleClick}
        disabled={disabled}
        size="lg"
        radius="md"
        fullWidth
        leftSection={
          <motion.div
            animate={{
              rotate: isPressed ? 360 : 0,
              scale: isHovered && !disabled ? 1.1 : 1
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            {leftSection}
          </motion.div>
        }
        style={{
          background: disabled ? 
            'linear-gradient(45deg, rgba(80, 80, 80, 0.6), rgba(60, 60, 60, 0.6))' :
            `linear-gradient(45deg, 
              ${isHovered ? 
                'rgba(255, 107, 107, 0.9), rgba(76, 236, 196, 0.9), rgba(69, 183, 209, 0.9)' :
                'rgba(255, 107, 107, 0.8), rgba(76, 236, 196, 0.8), rgba(69, 183, 209, 0.8)'
              }
            )`,
          backgroundSize: '200% 200%',
          border: disabled ?
            '2px solid rgba(100, 100, 100, 0.3)' :
            '2px solid transparent',
          backgroundClip: 'padding-box',
          color: disabled ? 'rgba(255, 255, 255, 0.4)' : 'white',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textTransform: 'none',
          textShadow: disabled ? 'none' : '0 0 15px rgba(0, 0, 0, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.3)',
          boxShadow: disabled ? 
            '0 2px 8px rgba(0, 0, 0, 0.3)' : 
            isHovered ? 
              '0 12px 40px rgba(255, 107, 107, 0.6), 0 0 30px rgba(76, 236, 196, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.15)' :
              '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 107, 107, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          position: 'relative'
        }}
        animate={{
          backgroundPosition: disabled ? 
            '0% 50%' : 
            isHovered ? 
              ['0% 50%', '100% 50%', '0% 50%'] : 
              '0% 50%'
        }}
        transition={{
          backgroundPosition: {
            duration: disabled ? 0 : isHovered ? 2 : 0,
            repeat: disabled ? 0 : isHovered ? Infinity : 0,
            ease: "linear"
          }
        }}
        {...props}
      >
        {/* Button Content */}
        <motion.div
          style={{ 
            position: 'relative', 
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          animate={{
            textShadow: isHovered && !disabled ? 
              '0 0 20px rgba(255, 255, 255, 0.8)' : 
              '0 0 10px rgba(0, 0, 0, 0.3)'
          }}
        >
          {children}
        </motion.div>

        {/* Ripple Effect Particles */}
        <RippleParticles />

        {/* Pulse rings on hover */}
        {isHovered && !disabled && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`pulse-${i}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
                animate={{
                  scale: [1, 3],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}

        {/* Loading shimmer effect when disabled */}
        {disabled && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `
                linear-gradient(90deg, 
                  transparent 0%, 
                  rgba(255, 255, 255, 0.1) 50%, 
                  transparent 100%
                )
              `,
              pointerEvents: 'none'
            }}
            animate={{
              left: ['100%', '-100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </MotionButton>
    </motion.div>
  )
}