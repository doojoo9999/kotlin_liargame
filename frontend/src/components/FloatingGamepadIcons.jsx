import React from 'react'
import {motion} from 'framer-motion'
import {IconDeviceGamepad, IconDeviceGamepad2} from '@tabler/icons-react'

export function FloatingGamepadIcons() {
  const icons = [
    { 
      id: 1, 
      Icon: IconDeviceGamepad2, 
      x: 10, 
      y: 20, 
      size: 32, 
      color: 'rgba(102, 126, 234, 0.6)',
      delay: 0 
    },
    { 
      id: 2, 
      Icon: IconDeviceGamepad, 
      x: 85, 
      y: 15, 
      size: 28, 
      color: 'rgba(76, 236, 196, 0.6)',
      delay: 1 
    },
    { 
      id: 3, 
      Icon: IconDeviceGamepad, 
      x: 15, 
      y: 75, 
      size: 24, 
      color: 'rgba(255, 107, 107, 0.6)',
      delay: 2 
    },
    { 
      id: 4, 
      Icon: IconDeviceGamepad2, 
      x: 80, 
      y: 70, 
      size: 30, 
      color: 'rgba(150, 206, 180, 0.6)',
      delay: 1.5 
    },
    { 
      id: 5, 
      Icon: IconDeviceGamepad2, 
      x: 50, 
      y: 10, 
      size: 26, 
      color: 'rgba(255, 234, 167, 0.6)',
      delay: 0.5 
    }
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      {icons.map((icon) => (
        <motion.div
          key={icon.id}
          style={{
            position: 'absolute',
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            color: icon.color,
            filter: 'blur(0.5px)'
          }}
          initial={{ 
            opacity: 0, 
            scale: 0,
            rotate: 0
          }}
          animate={{
            opacity: [0, 1, 0.7, 1],
            scale: [0, 1.2, 0.8, 1],
            rotate: [0, 180, 360],
            y: [0, -20, 0, -10, 0],
            x: [0, 10, -5, 0]
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: icon.delay,
            ease: "easeInOut"
          }}
        >
          <motion.div
            animate={{
              rotate: [0, -360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <icon.Icon 
              size={icon.size} 
              style={{
                filter: 'drop-shadow(0 0 8px currentColor)',
                opacity: 0.8
              }}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Additional small particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '4px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)'
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}