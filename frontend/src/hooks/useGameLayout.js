import {useCallback, useEffect, useMemo, useState} from 'react'
import {useMediaQuery, useTheme} from '@mui/material'
import {LAYOUT_CONFIG} from '../components/AdaptiveGameLayout'

const useGameLayout = ({
  gameStatus = 'WAITING',
  playerCount = 0,
  enableTransitions = true,
  customLayoutConfig = null
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

  const [layoutState, setLayoutState] = useState({
    currentLayout: 'WAITING',
    isTransitioning: false,
    transitionDuration: 0,
    panelVisibility: {
      left: true,
      center: true,
      right: true
    }
  })

  // Get effective layout configuration
  const layoutConfig = useMemo(() => {
    return customLayoutConfig || LAYOUT_CONFIG
  }, [customLayoutConfig])

  // Get current layout ratios based on game status
  const currentLayoutRatios = useMemo(() => {
    const config = layoutConfig[gameStatus] || layoutConfig.WAITING
    
    // Adjust ratios based on screen size and player count
    if (isMobile) {
      // Mobile uses vertical stacking, so ratios don't apply
      return { left: '100%', center: '100%', right: '100%' }
    }
    
    if (isTablet) {
      // Tablet might need slightly adjusted ratios
      return {
        left: config.left,
        center: config.center,
        right: config.right
      }
    }
    
    // Desktop uses full configuration
    return config
  }, [gameStatus, layoutConfig, isMobile, isTablet])

  // Calculate optimal panel visibility based on context
  const calculatePanelVisibility = useCallback((status, screenType) => {
    const baseVisibility = { left: true, center: true, right: true }

    // Mobile specific logic
    if (screenType === 'mobile') {
      return {
        left: false, // Left panel handled by drawer
        center: true,
        right: false // Right panel handled by drawer
      }
    }

    // Game status specific visibility rules
    switch (status) {
      case 'WAITING':
        return {
          left: true, // Show player setup info
          center: true,
          right: true // Chat for coordination
        }
      
      case 'HINT_PHASE':
      case 'SPEAKING':
        return {
          left: true, // Action guidance is critical
          center: true,
          right: true // Chat for reactions
        }
      
      case 'VOTING':
        return {
          left: true, // Voting progress and guidance
          center: true,
          right: true // Discussion and reactions
        }
      
      case 'DEFENSE':
        return {
          left: true, // Show accused player info
          center: true,
          right: true // Chat for reactions to defense
        }
      
      case 'WORD_GUESS':
        return {
          left: true, // Show liar guidance or waiting info
          center: true,
          right: false // Reduce chat distraction
        }
      
      case 'RESULTS':
      case 'FINISHED':
        return {
          left: true, // Game summary
          center: true,
          right: true // Chat for post-game discussion
        }
      
      default:
        return baseVisibility
    }
  }, [])

  // Get current screen type
  const screenType = useMemo(() => {
    if (isMobile) return 'mobile'
    if (isTablet) return 'tablet'
    return 'desktop'
  }, [isMobile, isTablet])

  // Update layout state when game status changes
  useEffect(() => {
    const newVisibility = calculatePanelVisibility(gameStatus, screenType)
    
    setLayoutState(prevState => ({
      ...prevState,
      currentLayout: gameStatus,
      isTransitioning: enableTransitions && prevState.currentLayout !== gameStatus,
      transitionDuration: enableTransitions ? theme.transitions.duration.standard : 0,
      panelVisibility: newVisibility
    }))

    // Clear transition state after transition completes
    if (enableTransitions) {
      const timeout = setTimeout(() => {
        setLayoutState(prevState => ({
          ...prevState,
          isTransitioning: false
        }))
      }, theme.transitions.duration.standard)

      return () => clearTimeout(timeout)
    }
  }, [gameStatus, screenType, enableTransitions, theme.transitions.duration.standard, calculatePanelVisibility])

  // Get layout metrics for performance optimization
  const layoutMetrics = useMemo(() => {
    const leftWidth = currentLayoutRatios.left
    const centerWidth = currentLayoutRatios.center  
    const rightWidth = currentLayoutRatios.right

    return {
      leftPanelWidth: leftWidth,
      centerPanelWidth: centerWidth,
      rightPanelWidth: rightWidth,
      totalPanels: Object.values(layoutState.panelVisibility).filter(Boolean).length,
      screenType,
      isCompactMode: screenType === 'tablet',
      isMobileMode: screenType === 'mobile'
    }
  }, [currentLayoutRatios, layoutState.panelVisibility, screenType])

  // Force layout recalculation
  const recalculateLayout = useCallback(() => {
    setLayoutState(prevState => ({
      ...prevState,
      isTransitioning: true
    }))

    setTimeout(() => {
      setLayoutState(prevState => ({
        ...prevState,
        isTransitioning: false
      }))
    }, 100)
  }, [])

  // Toggle panel visibility
  const togglePanelVisibility = useCallback((panel) => {
    if (screenType === 'mobile') {
      // Mobile panels are handled by drawers, not direct visibility
      return
    }

    setLayoutState(prevState => ({
      ...prevState,
      panelVisibility: {
        ...prevState.panelVisibility,
        [panel]: !prevState.panelVisibility[panel]
      }
    }))
  }, [screenType])

  // Get recommended layout for current context
  const getRecommendedLayout = useCallback((gameStatus, playerCount, chatActivity = 'normal') => {
    let recommendation = { ...layoutConfig[gameStatus] || layoutConfig.WAITING }

    // Adjust based on player count
    if (playerCount <= 4) {
      // Fewer players, can give more space to chat
      recommendation.right = '30%'
      recommendation.center = '45%'
      recommendation.left = '25%'
    } else if (playerCount >= 8) {
      // More players, might need more space for player info
      recommendation.left = '30%'
      recommendation.center = '40%'
      recommendation.right = '30%'
    }

    // Adjust based on chat activity (if we had metrics)
    if (chatActivity === 'high') {
      recommendation.right = '40%'
      recommendation.center = '35%'
      recommendation.left = '25%'
    }

    return recommendation
  }, [layoutConfig])

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    return {
      layoutEfficiency: layoutMetrics.totalPanels / 3, // Ratio of visible panels
      spaceUtilization: screenType === 'desktop' ? 0.95 : screenType === 'tablet' ? 0.90 : 0.85,
      transitionCost: layoutState.isTransitioning ? 'high' : 'low',
      recommendedOptimizations: []
    }
  }, [layoutMetrics.totalPanels, screenType, layoutState.isTransitioning])

  return {
    // Layout state
    layoutRatios: currentLayoutRatios,
    layoutState,
    panelVisibility: layoutState.panelVisibility,
    
    // Screen info
    screenType,
    isMobile,
    isTablet,
    isDesktop,
    
    // Metrics and performance
    layoutMetrics,
    performanceMetrics,
    
    // Actions
    recalculateLayout,
    togglePanelVisibility,
    getRecommendedLayout,
    
    // Utility
    isTransitioning: layoutState.isTransitioning,
    transitionDuration: layoutState.transitionDuration
  }
}

export default useGameLayout