import React, {useRef, useState} from 'react'
import {Box, TextInput} from '@mantine/core'
import {AnimatePresence, motion} from 'framer-motion'

export function GamingTextInput({ 
  label, 
  error, 
  value, 
  onChange, 
  onFocus, 
  onBlur,
  ...props 
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef(null)

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const handleChange = (e) => {
    const newValue = e.target.value
    setHasValue(newValue.length > 0)
    onChange?.(e)
  }

  // Typing particle effects
  const TypingParticles = () => {
    if (!isFocused) return null
    
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              right: `${10 + i * 5}px`,
              top: '50%',
              width: '4px',
              height: '4px',
              background: '#4ecdc4',
              borderRadius: '50%',
              boxShadow: '0 0 8px #4ecdc4'
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              x: [0, 10, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </>
    )
  }

  return (
    <Box style={{ position: 'relative', marginBottom: '24px' }}>
      {/* Floating Label */}
      <AnimatePresence>
        <motion.div
          style={{
            position: 'absolute',
            left: '16px',
            pointerEvents: 'none',
            zIndex: 10,
            color: isFocused ? '#4ecdc4' : hasValue ? '#667eea' : 'rgba(255,255,255,0.7)',
            fontWeight: 500
          }}
          animate={{
            y: isFocused || hasValue || value ? -28 : 0,
            scale: isFocused || hasValue || value ? 0.85 : 1,
            color: isFocused ? '#4ecdc4' : hasValue || value ? '#667eea' : 'rgba(255,255,255,0.7)'
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          {label}
        </motion.div>
      </AnimatePresence>

      {/* Input Container */}
      <motion.div
        style={{ position: 'relative' }}
        animate={{
          scale: isFocused ? 1.02 : 1
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut"
        }}
      >
        {/* Neon Glow Background */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '8px',
            background: isFocused ? 
              'linear-gradient(45deg, rgba(76, 236, 196, 0.2), rgba(102, 126, 234, 0.2))' : 
              'transparent',
            filter: 'blur(8px)',
            zIndex: -1
          }}
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1.1 : 1
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        />

        {/* Main Input */}
        <TextInput
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          size="lg"
          radius="md"
          error={error}
          styles={{
            input: {
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.15) 0%, 
                  rgba(255, 255, 255, 0.05) 100%
                )
              `,
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              border: isFocused ? 
                '2px solid transparent' : 
                error ? 
                  '2px solid rgba(255, 107, 107, 0.5)' : 
                  '2px solid rgba(255, 255, 255, 0.2)',
              backgroundImage: isFocused ? 
                'linear-gradient(45deg, #4ecdc4, #667eea, #4ecdc4)' : 
                'none',
              backgroundSize: '200% 200%',
              backgroundClip: 'border-box',
              color: 'white',
              fontSize: '16px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              '&:focus': {
                animation: 'borderFlow 3s linear infinite'
              },
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.4)'
              }
            },
            label: {
              display: 'none'
            }
          }}
          {...props}
        />

        {/* Typing Particles */}
        <TypingParticles />

        {/* Bottom Glow Line */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            height: '2px',
            background: 'linear-gradient(90deg, #4ecdc4, #667eea, #4ecdc4)',
            borderRadius: '1px'
          }}
          animate={{
            width: isFocused ? '100%' : '0%',
            x: '-50%'
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut"
          }}
        />

        {/* Character Counter */}
        {props.maxLength && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '-20px',
              right: '8px',
              fontSize: '12px',
              color: value?.length >= props.maxLength * 0.8 ? 
                '#ffa726' : 'rgba(255,255,255,0.5)'
            }}
            animate={{
              opacity: isFocused ? 1 : 0
            }}
            transition={{
              duration: 0.3
            }}
          >
            {value?.length || 0}/{props.maxLength}
          </motion.div>
        )}
      </motion.div>

      {/* Error Message with Animation */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: '8px',
              color: '#ff6b6b',
              fontSize: '14px',
              fontWeight: 500,
              textShadow: '0 0 8px rgba(255, 107, 107, 0.3)'
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animation for Border Flow */}
      <style>{`
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </Box>
  )
}