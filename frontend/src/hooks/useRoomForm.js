import {useEffect, useState} from 'react'
import config from '../config/environment'

/**
 * Custom hook for managing room creation form state
 * @param {Object} options - Configuration options
 * @param {Array} options.subjects - Available subjects array
 * @param {Object} options.currentUser - Current user object
 * @returns {Object} Object containing form state and control functions
 */
export const useRoomForm = ({ subjects = [], currentUser = null } = {}) => {
  const [roomForm, setRoomForm] = useState({
    title: '',
    maxPlayers: config.game.minPlayers,
    gTotalRounds: config.game.defaultRounds,
    password: '',
    selectedSubjectIds: [],
    hasPassword: false,
    gameMode: 'LIARS_KNOW' // 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD'
  })

  const [joinPassword, setJoinPassword] = useState('')

  // Initialize with first subject if no subjects are selected and subjects are available
  useEffect(() => {
    if (subjects.length > 0 && roomForm.selectedSubjectIds.length === 0) {
      setRoomForm(prev => ({
        ...prev,
        selectedSubjectIds: [subjects[0]?.id].filter(Boolean)
      }))
    }
  }, [subjects, roomForm.selectedSubjectIds.length])

  /**
   * Handle room form field changes
   * @param {string} field - Field name to update
   * @param {any} value - New value for the field
   */
  const handleRoomFormChange = (field, value) => {
    // 즉시 상태 업데이트를 위해 React.unstable_batchedUpdates 사용하지 않음
    setRoomForm(prev => {
      if (prev[field] === value) return prev // 값이 같으면 업데이트 하지 않음
      return {
        ...prev,
        [field]: value
      }
    })
  }

  /**
   * Reset room form to initial state
   */
  const resetRoomForm = () => {
    setRoomForm({
      title: '',
      maxPlayers: config.game.minPlayers,
      gTotalRounds: config.game.defaultRounds,
      password: '',
      selectedSubjectIds: subjects.length > 0 ? [subjects[0]?.id].filter(Boolean) : [],
      hasPassword: false,
      gameMode: 'LIARS_KNOW'
    })
  }

  /**
   * Set default title with current user's name
   */
  const setDefaultTitle = () => {
    const defaultTitle = currentUser ? `${currentUser.nickname}님의 방` : '새로운 방'
    setRoomForm(prev => ({
      ...prev,
      title: defaultTitle
    }))
  }

  /**
   * Get final room data for submission
   * @returns {Object} Room data formatted for API
   */
  const getRoomData = () => {
    const defaultTitle = currentUser ? `${currentUser.nickname}님의 방` : '새로운 방'
    const finalTitle = roomForm.title.trim() || defaultTitle
    
    return {
      gameName: finalTitle,
      gameParticipants: roomForm.maxPlayers,
      gameTotalRounds: roomForm.gTotalRounds,
      gamePassword: roomForm.hasPassword ? roomForm.password : null,
      subjectIds: roomForm.selectedSubjectIds.length > 0 ? roomForm.selectedSubjectIds : null,
      useRandomSubjects: roomForm.selectedSubjectIds.length === 0,
      randomSubjectCount: roomForm.selectedSubjectIds.length === 0 ? 1 : null
    }
  }

  /**
   * Reset join password
   */
  const resetJoinPassword = () => {
    setJoinPassword('')
  }

  return {
    // Form state
    roomForm,
    joinPassword,
    
    // Form actions
    handleRoomFormChange,
    setJoinPassword,
    resetRoomForm,
    setDefaultTitle,
    getRoomData,
    resetJoinPassword
  }
}