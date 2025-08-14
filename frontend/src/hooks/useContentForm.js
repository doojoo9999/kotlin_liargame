import {useState} from 'react'

/**
 * Custom hook for managing content addition form state
 * @returns {Object} Object containing form state and control functions
 */
export const useContentForm = () => {
  const [contentForm, setContentForm] = useState({
    newSubject: '',
    selectedSubject: '',
    newWord: ''
  })

  /**
   * Handle content form field changes
   * @param {string} field - Field name to update
   * @param {any} value - New value for the field
   */
  const handleContentFormChange = (field, value) => {
    setContentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * Reset new subject field
   */
  const resetNewSubject = () => {
    setContentForm(prev => ({ ...prev, newSubject: '' }))
  }

  /**
   * Reset new word field
   */
  const resetNewWord = () => {
    setContentForm(prev => ({ ...prev, newWord: '' }))
  }

  /**
   * Reset selected subject field
   */
  const resetSelectedSubject = () => {
    setContentForm(prev => ({ ...prev, selectedSubject: '' }))
  }

  /**
   * Reset entire content form
   */
  const resetContentForm = () => {
    setContentForm({
      newSubject: '',
      selectedSubject: '',
      newWord: ''
    })
  }

  /**
   * Get trimmed subject value
   * @returns {string} Trimmed new subject value
   */
  const getTrimmedSubject = () => {
    return contentForm.newSubject.trim()
  }

  /**
   * Get trimmed word value
   * @returns {string} Trimmed new word value
   */
  const getTrimmedWord = () => {
    return contentForm.newWord.trim()
  }

  /**
   * Check if subject form is valid
   * @returns {boolean} True if subject can be added
   */
  const isSubjectValid = () => {
    return getTrimmedSubject().length > 0
  }

  /**
   * Check if word form is valid
   * @returns {boolean} True if word can be added
   */
  const isWordValid = () => {
    return contentForm.selectedSubject && getTrimmedWord().length > 0
  }

  return {
    // Form state
    contentForm,
    
    // Form actions
    handleContentFormChange,
    resetNewSubject,
    resetNewWord,
    resetSelectedSubject,
    resetContentForm,
    
    // Validation and utilities
    getTrimmedSubject,
    getTrimmedWord,
    isSubjectValid,
    isWordValid
  }
}