import React, {useMemo} from 'react'
import {Box, useMediaQuery, useTheme} from '@mui/material'

// Layout configuration for different game phases
const LAYOUT_CONFIG = {
  WAITING: { left: '25%', center: '50%', right: '25%' },
  HINT_PHASE: { left: '20%', center: '45%', right: '35%' },
  SPEAKING: { left: '20%', center: '45%', right: '35%' },
  VOTING: { left: '30%', center: '35%', right: '35%' },
  DEFENSE: { left: '25%', center: '40%', right: '35%' },
  SURVIVAL_VOTING: { left: '25%', center: '40%', right: '35%' },
  WORD_GUESS: { left: '20%', center: '60%', right: '20%' },
  RESULTS: { left: '20%', center: '60%', right: '20%' },
  FINISHED: { left: '20%', center: '60%', right: '20%' }
}

// Responsive breakpoints configuration
const RESPONSIVE_CONFIG = {
  mobile: {
    breakpoint: 'md',
    layout: 'vertical'
  },
  tablet: {
    breakpoint: 'lg', 
    layout: 'hybrid'
  },
  desktop: {
    layout: 'grid'
  }
}

const AdaptiveGameLayout = ({
  children,
  leftPanel,
  centerComponent,
  rightPanel,
  gameStatus = 'WAITING',
  className,
  ...props
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  
  // Get layout ratios based on game status
  const layoutRatios = useMemo(() => {
    const config = LAYOUT_CONFIG[gameStatus] || LAYOUT_CONFIG.WAITING
    return config
  }, [gameStatus])

  // Calculate transition timing
  const transitionTiming = useMemo(() => {
    return theme.transitions.duration.standard
  }, [theme.transitions.duration.standard])

  // Mobile layout - vertical stacking
  if (isMobile) {
    return (
      <Box
        className={className}
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: `all ${transitionTiming}ms ease-in-out`,
          ...props.sx
        }}
        {...props}
      >
        {/* Mobile specific layout will be handled by ResponsiveGameLayout */}
        {children}
      </Box>
    )
  }

  // Tablet layout - hybrid approach
  if (isTablet) {
    return (
      <Box
        className={className}
        sx={{
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: `${layoutRatios.left} ${layoutRatios.center} ${layoutRatios.right}`,
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "header header header"
            "left center right"
          `,
          gap: 1,
          transition: `grid-template-columns ${transitionTiming}ms ease-in-out`,
          ...props.sx
        }}
        {...props}
      >
        {/* Header area for game info (handled by parent) */}
        
        {/* Left panel */}
        {leftPanel && (
          <Box
            sx={{
              gridArea: 'left',
              overflow: 'hidden',
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 200ms ease-in-out'
            }}
          >
            {leftPanel}
          </Box>
        )}

        {/* Center game area */}
        <Box
          sx={{
            gridArea: 'center',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          {children}
          
          {/* Center component overlay */}
          {centerComponent && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: 600,
                zIndex: 2
              }}
            >
              {centerComponent}
            </Box>
          )}
        </Box>

        {/* Right panel */}
        {rightPanel && (
          <Box
            sx={{
              gridArea: 'right',
              overflow: 'hidden',
              borderLeft: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 200ms ease-in-out'
            }}
          >
            {rightPanel}
          </Box>
        )}
      </Box>
    )
  }

  // Desktop layout - full CSS Grid with dynamic ratios
  return (
    <Box
      className={className}
      sx={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: `${layoutRatios.left} ${layoutRatios.center} ${layoutRatios.right}`,
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: `
          "header header header"
          "left center right"
        `,
        gap: 0,
        transition: `grid-template-columns ${transitionTiming}ms ease-in-out`,
        backgroundColor: theme.palette.background.default,
        ...props.sx
      }}
      {...props}
    >
      {/* Left information panel */}
      {leftPanel && (
        <Box
          sx={{
            gridArea: 'left',
            overflow: 'hidden',
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
            transition: 'all 200ms ease-in-out'
          }}
        >
          {leftPanel}
        </Box>
      )}

      {/* Center game area */}
      <Box
        sx={{
          gridArea: 'center',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          backgroundColor: theme.palette.background.default
        }}
      >
        {/* Players positioned around the edges */}
        {children}
        
        {/* Center component (voting, hints, etc.) */}
        {centerComponent && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 64px)',
              maxWidth: 800,
              zIndex: 2,
              transition: 'all 200ms ease-in-out'
            }}
          >
            {centerComponent}
          </Box>
        )}
      </Box>

      {/* Right panel (expanded chat + secondary info) */}
      {rightPanel && (
        <Box
          sx={{
            gridArea: 'right',
            overflow: 'hidden',
            borderLeft: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.palette.background.paper,
            transition: 'all 200ms ease-in-out'
          }}
        >
          {rightPanel}
        </Box>
      )}
    </Box>
  )
}

export default AdaptiveGameLayout
export { LAYOUT_CONFIG, RESPONSIVE_CONFIG }