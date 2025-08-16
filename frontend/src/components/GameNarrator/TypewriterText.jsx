import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Box, Typography} from '@components/ui'

const TYPING_SPEEDS = {
  info: 50,     // General messages (50ms/char)
  warning: 30,  // Important alerts (30ms/char) 
  celebration: 40 // Game results (40ms/char)
}

const TypewriterText = React.memo(function TypewriterText({
  text = '',
  category = 'info',
  onComplete,
  onSkip,
  showCursor = true,
  cursorChar = '|',
  startDelay = 0,
  pauseOnPunctuation = 100,
  variant = 'body1',
  sx = {},
  clickToSkip = true,
  ...typographyProps
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [showCursorBlink, setShowCursorBlink] = useState(true)
  
  const animationRef = useRef(null)
  const timeoutRef = useRef(null)
  const currentIndexRef = useRef(0)
  const isSkippedRef = useRef(false)

  const typingSpeed = TYPING_SPEEDS[category] || TYPING_SPEEDS.info

  const startTyping = useCallback(() => {
    if (!text) return
    
    setIsTyping(true)
    setIsComplete(false)
    setDisplayedText('')
    currentIndexRef.current = 0
    isSkippedRef.current = false

    const typeNextCharacter = () => {
      if (isSkippedRef.current) return

      const currentIndex = currentIndexRef.current
      if (currentIndex >= text.length) {
        setIsTyping(false)
        setIsComplete(true)
        setShowCursorBlink(false)
        onComplete?.()
        return
      }

      const char = text[currentIndex]
      setDisplayedText(text.substring(0, currentIndex + 1))
      currentIndexRef.current++

      // Add pause for punctuation marks
      const isPunctuation = /[.!?;:]/.test(char)
      const delay = isPunctuation ? pauseOnPunctuation : typingSpeed

      timeoutRef.current = setTimeout(typeNextCharacter, delay)
    }

    // Start with initial delay
    timeoutRef.current = setTimeout(typeNextCharacter, startDelay)
  }, [text, typingSpeed, pauseOnPunctuation, startDelay, onComplete])

  const skipTyping = useCallback(() => {
    if (!isTyping || isComplete) return

    isSkippedRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    setDisplayedText(text)
    setIsTyping(false)
    setIsComplete(true)
    setShowCursorBlink(false)
    onSkip?.()
    onComplete?.()
  }, [isTyping, isComplete, text, onSkip, onComplete])

  const handleClick = useCallback(() => {
    if (clickToSkip && isTyping) {
      skipTyping()
    }
  }, [clickToSkip, isTyping, skipTyping])

  const handleKeyPress = useCallback((event) => {
    if (clickToSkip && isTyping && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault()
      skipTyping()
    }
  }, [clickToSkip, isTyping, skipTyping])

  // Start typing when text changes
  useEffect(() => {
    if (text) {
      // Clear any existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      startTyping()
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [text, startTyping])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <Box
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={clickToSkip ? 0 : -1}
      sx={{
        cursor: clickToSkip && isTyping ? 'pointer' : 'default',
        outline: 'none',
        '&:focus': {
          outline: clickToSkip ? '2px solid rgba(25, 118, 210, 0.5)' : 'none',
          outlineOffset: '2px'
        }
      }}
      role={clickToSkip ? 'button' : undefined}
      aria-label={clickToSkip && isTyping ? '클릭하여 타이핑 건너뛰기' : undefined}
    >
      <Typography
        variant={variant}
        sx={{
          ...sx,
          display: 'inline',
          // Accessibility: Ensure screen readers can read the content
          'aria-live': 'polite',
          'aria-atomic': 'true'
        }}
        {...typographyProps}
      >
        {displayedText}
        {/* Cursor */}
        {showCursor && (isTyping || showCursorBlink) && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              animation: showCursorBlink ? 'cursorBlink 1s ease-in-out infinite' : 'none',
              '@keyframes cursorBlink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0 }
              },
              ml: 0.2,
              fontWeight: 'normal',
              color: 'inherit'
            }}
            aria-hidden="true"
          >
            {cursorChar}
          </Box>
        )}
      </Typography>

      {/* Click hint for mobile/touch devices */}
      {clickToSkip && isTyping && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            opacity: 0.6,
            fontSize: '0.75rem',
            fontStyle: 'italic',
            animation: 'fadeInOut 3s ease-in-out infinite',
            '@keyframes fadeInOut': {
              '0%, 100%': { opacity: 0.6 },
              '50%': { opacity: 0.3 }
            }
          }}
          aria-hidden="true"
        >
          클릭하여 건너뛰기
        </Typography>
      )}

      {/* Screen reader announcement for completion */}
      {isComplete && (
        <Box
          sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px' }}
          aria-live="assertive"
          aria-atomic="true"
        >
          메시지 표시 완료
        </Box>
      )}
    </Box>
  )
})

TypewriterText.displayName = 'TypewriterText'
export default TypewriterText