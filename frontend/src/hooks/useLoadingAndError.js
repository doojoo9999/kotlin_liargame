import {useCallback} from 'react'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useLoadingAndError = (state, dispatch) => {
  // Set loading state for a specific operation
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])

  // Set error state for a specific operation
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    Object.values(LOADING_KEYS).forEach(key => {
      setLoading(key, false)
    })
  }, [setLoading])

  // Clear all error states
  const clearAllErrors = useCallback(() => {
    Object.values(ERROR_KEYS).forEach(key => {
      setError(key, null)
    })
  }, [setError])

  // Clear loading state for a specific operation
  const clearLoading = useCallback((type) => {
    setLoading(type, false)
  }, [setLoading])

  // Clear error state for a specific operation
  const clearError = useCallback((type) => {
    setError(type, null)
  }, [setError])

  // Check if any loading state is active
  const isAnyLoading = useCallback(() => {
    return Object.values(state.loading).some(loading => loading === true)
  }, [state.loading])

  // Check if any error state has a value
  const hasAnyError = useCallback(() => {
    return Object.values(state.error).some(error => error !== null)
  }, [state.error])

  // Get loading state for a specific operation
  const getLoading = useCallback((type) => {
    return state.loading[type] || false
  }, [state.loading])

  // Get error state for a specific operation
  const getError = useCallback((type) => {
    return state.error[type] || null
  }, [state.error])

  return {
    // Core functions
    setLoading,
    setError,
    clearLoading,
    clearError,
    clearAllLoading,
    clearAllErrors,
    
    // Getter functions
    getLoading,
    getError,
    
    // Utility functions
    isAnyLoading,
    hasAnyError,
    
    // Direct state access
    loading: state.loading,
    error: state.error
  }
}