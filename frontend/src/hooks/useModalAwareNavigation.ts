import {useEffect, useRef} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import {useModal} from '@/contexts/ModalContext'
import {useToast} from '@/hooks/useToast'

interface UseModalAwareNavigationOptions {
  enableWarning?: boolean
  warningMessage?: string
}

export function useModalAwareNavigation(options: UseModalAwareNavigationOptions = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAnyModalOpen, activeModals } = useModal()
  const { toast } = useToast()
  const originalNavigateRef = useRef(navigate)

  const {
    enableWarning = true,
    warningMessage = '모달이 열려있는 동안에는 페이지를 이동할 수 없습니다.'
  } = options

  // Create a modal-aware navigate function
  const modalAwareNavigate = useRef((path: string | number, options?: any) => {
    const navigationAttempt = {
      targetPath: path,
      targetOptions: options,
      currentLocation: location.pathname,
      currentSearch: location.search,
      activeModals: Array.from(activeModals),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      stack: new Error().stack?.split('\n').slice(2, 8).join('\n')
    }

    if (isAnyModalOpen) {
      console.warn(`[Navigation] 🚫 BLOCKED - Modal interference detected:`, navigationAttempt)

      // Log detailed context for debugging
      console.group(`[Navigation] Blocked Navigation Context`)
      console.table({
        'Target Path': path,
        'Current Path': location.pathname,
        'Active Modals': activeModals.size,
        'Modal IDs': Array.from(activeModals).join(', ')
      })
      console.log('Full Navigation Context:', navigationAttempt)
      console.groupEnd()

      if (enableWarning) {
        toast({
          title: "페이지 이동 차단됨",
          description: warningMessage,
          variant: "destructive",
        })
      }
      return
    }

    console.log(`[Navigation] ✅ ALLOWED - No modal interference:`, {
      targetPath: path,
      currentPath: location.pathname,
      timestamp: new Date().toISOString()
    })

    if (typeof path === 'number') {
      originalNavigateRef.current(path)
    } else {
      originalNavigateRef.current(path, options)
    }
  })

  // Prevent browser back/forward during modal interaction
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isAnyModalOpen) {
        event.preventDefault()
        event.returnValue = warningMessage
        return warningMessage
      }
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isAnyModalOpen) {
        const browserNavAttempt = {
          event: 'browser_navigation',
          currentPath: location.pathname,
          activeModals: Array.from(activeModals),
          timestamp: new Date().toISOString(),
          historyState: event.state
        }

        console.warn('[Navigation] 🚫 BLOCKED - Browser back/forward due to active modal:', browserNavAttempt)
        event.preventDefault()

        // Push the current state back to maintain current page
        window.history.pushState(null, '', location.pathname + location.search)

        if (enableWarning) {
          toast({
            title: "브라우저 네비게이션 차단됨",
            description: warningMessage,
            variant: "destructive",
          })
        }
      }
    }

    if (isAnyModalOpen) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [activeModals, enableWarning, isAnyModalOpen, location, toast, warningMessage])

  return {
    navigate: modalAwareNavigate.current,
    isNavigationBlocked: isAnyModalOpen,
    activeModals: Array.from(activeModals)
  }
}

// Utility function to check if navigation should be blocked
export function shouldBlockNavigation(activeModals: Set<string>): boolean {
  return activeModals.size > 0
}

// Higher-order function to wrap any navigation function with modal awareness
export function withModalAwareNavigation<T extends (...args: any[]) => void>(
  navigationFn: T,
  isAnyModalOpen: boolean,
  onBlock?: () => void
): T {
  return ((...args: any[]) => {
    if (isAnyModalOpen) {
      console.warn('[Navigation Blocked] Function call blocked due to active modal:', navigationFn.name)
      onBlock?.()
      return
    }
    return navigationFn(...args)
  }) as T
}