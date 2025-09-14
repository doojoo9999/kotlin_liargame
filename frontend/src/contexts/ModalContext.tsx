import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ModalContextType {
  activeModals: Set<string>
  isAnyModalOpen: boolean
  registerModal: (modalId: string) => void
  unregisterModal: (modalId: string) => void
  preventNavigation: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [activeModals, setActiveModals] = useState<Set<string>>(new Set())

  const registerModal = useCallback((modalId: string) => {
    setActiveModals(prev => {
      if (prev.has(modalId)) {
        console.warn(`[ModalProvider] Modal ${modalId} already registered`)
        return prev
      }

      const newSet = new Set(prev)
      newSet.add(modalId)

      console.log(`[ModalProvider] ✅ Modal registered: ${modalId}`, {
        modalId,
        activeCount: newSet.size,
        allActiveModals: Array.from(newSet),
        timestamp: new Date().toISOString(),
        stack: new Error().stack?.split('\n').slice(2, 5).join('\n')
      })

      // Log navigation prevention status
      if (newSet.size === 1) {
        console.log(`[ModalProvider] 🚫 Navigation prevention ACTIVATED`)
      }

      return newSet
    })
  }, [])

  const unregisterModal = useCallback((modalId: string) => {
    setActiveModals(prev => {
      if (!prev.has(modalId)) {
        console.warn(`[ModalProvider] Attempted to unregister non-existent modal: ${modalId}`)
        return prev
      }

      const newSet = new Set(prev)
      newSet.delete(modalId)

      console.log(`[ModalProvider] ❌ Modal unregistered: ${modalId}`, {
        modalId,
        activeCount: newSet.size,
        remainingModals: Array.from(newSet),
        timestamp: new Date().toISOString()
      })

      // Log navigation prevention status
      if (newSet.size === 0) {
        console.log(`[ModalProvider] ✅ Navigation prevention DEACTIVATED`)
      }

      return newSet
    })
  }, [])

  const isAnyModalOpen = activeModals.size > 0
  const preventNavigation = isAnyModalOpen

  const value: ModalContextType = {
    activeModals,
    isAnyModalOpen,
    registerModal,
    unregisterModal,
    preventNavigation
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

// Hook for modal components to automatically register/unregister
export function useModalRegistration(modalId: string, isOpen: boolean) {
  const { registerModal, unregisterModal } = useModal()

  React.useEffect(() => {
    if (isOpen) {
      registerModal(modalId)
      return () => unregisterModal(modalId)
    }
    // When isOpen is false, we don't need to do anything
    // The cleanup will handle unregistration when needed
  }, [isOpen, modalId, registerModal, unregisterModal])
}