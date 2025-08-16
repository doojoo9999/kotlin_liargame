import React from 'react'
import {motion} from 'framer-motion'
import {Box} from '@mantine/core'

// Floating particles component
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }))

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  )
}

// Geometric shapes component
function GeometricShapes() {
  const shapes = [
    { id: 1, type: 'circle', size: 80, x: 10, y: 20, color: 'rgba(102, 126, 234, 0.1)' },
    { id: 2, type: 'square', size: 60, x: 80, y: 10, color: 'rgba(118, 75, 162, 0.1)' },
    { id: 3, type: 'triangle', size: 70, x: 15, y: 70, color: 'rgba(139, 69, 19, 0.1)' },
    { id: 4, type: 'circle', size: 50, x: 70, y: 60, color: 'rgba(75, 0, 130, 0.1)' },
    { id: 5, type: 'hexagon', size: 40, x: 50, y: 30, color: 'rgba(255, 20, 147, 0.1)' }
  ]

  return (
    <>
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          style={{
            position: 'absolute',
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
            background: shape.color,
            borderRadius: shape.type === 'circle' ? '50%' : '0%',
            transform: shape.type === 'triangle' ? 'rotate(45deg)' : 'none',
            clipPath: shape.type === 'hexagon' ? 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' : 'none'
          }}
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </>
  )
}

// Main animated background component
export function AnimatedBackground() {
  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: -1
      }}
    >
      {/* Base gradient background */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
        animate={{
          background: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            'linear-gradient(135deg, #f093fb 0%, #667eea 50%, #764ba2 100%)',
            'linear-gradient(135deg, #764ba2 0%, #f093fb 50%, #667eea 100%)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Geometric shapes layer */}
      <GeometricShapes />

      {/* Floating particles layer */}
      <FloatingParticles />

      {/* Sparkle overlay */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `
        }}
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </Box>
  )
}