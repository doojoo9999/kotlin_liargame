import {useState} from 'react'

/**
 * Custom hook for managing snackbar notifications
 * @returns {Object} Object containing snackbar state and control functions
 */
export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success' | 'error' | 'warning' | 'info'
  })

  /**
   * Show snackbar with message and severity
   * @param {string} message - Message to display
   * @param {string} severity - Severity level ('success' | 'error' | 'warning' | 'info')
   */
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  /**
   * Close the snackbar
   */
  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  return {
    snackbar,
    showSnackbar,
    hideSnackbar
  }
}