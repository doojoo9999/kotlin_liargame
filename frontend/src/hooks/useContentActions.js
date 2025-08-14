import {useEffect, useRef} from 'react'

/**
 * Custom hook for content-related business logic
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.addSubject - Add subject function
 * @param {Function} dependencies.addWord - Add word function  
 * @param {Function} dependencies.showSnackbar - Show snackbar function
 * @param {Array} dependencies.subjects - Available subjects array
 * @returns {Object} Object containing content action functions
 */
export const useContentActions = ({
  addSubject,
  addWord,
  showSnackbar,
  subjects = []
}) => {
  const subjectsInitialized = useRef(false)
  const prevSubjectCount = useRef(0)

  // Monitor subjects changes and show notification for new subjects
  useEffect(() => {
    if (subjects.length > prevSubjectCount.current && prevSubjectCount.current > 0) {
      const newSubject = subjects[subjects.length - 1]
      showSnackbar(`새로운 주제 "${newSubject.name}"가 추가되었습니다!`, 'info')
    }
    
    prevSubjectCount.current = subjects.length
  }, [subjects.length, showSnackbar])

  /**
   * Handle adding a new subject
   * @param {string} newSubject - New subject name
   * @param {Function} resetNewSubject - Function to reset new subject field
   */
  const handleAddSubject = async (newSubject, resetNewSubject) => {
    if (!newSubject.trim()) {
      showSnackbar('주제를 입력해주세요.', 'error')
      return
    }

    // Check if subject already exists (safe object access)
    const existingSubject = subjects.find(s =>
      s &&
      s.name &&
      typeof s.name === 'string' &&
      s.name.toLowerCase() === newSubject.trim().toLowerCase()
    )
    if (existingSubject) {
      showSnackbar('이미 존재하는 주제입니다.', 'error')
      return
    }

    try {
      await addSubject(newSubject.trim())
      showSnackbar('주제가 성공적으로 추가되었습니다.', 'success')
      resetNewSubject()
    } catch (error) {
      console.error('Failed to add subject:', error)
      showSnackbar('주제 추가에 실패했습니다.', 'error')
    }
  }

  /**
   * Handle adding a new word to a subject
   * @param {string} selectedSubject - Selected subject ID
   * @param {string} newWord - New word to add
   * @param {Function} resetNewWord - Function to reset new word field
   */
  const handleAddWord = async (selectedSubject, newWord, resetNewWord) => {
    if (!selectedSubject) {
      showSnackbar('주제를 선택해주세요.', 'error')
      return
    }

    if (!newWord.trim()) {
      showSnackbar('답안을 입력해주세요.', 'error')
      return
    }

    try {
      const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name
      if (!selectedSubjectName) {
        showSnackbar('선택한 주제를 찾을 수 없습니다.', 'error')
        return
      }
      
      await addWord(selectedSubjectName, newWord.trim())
      showSnackbar('답안이 성공적으로 추가되었습니다.', 'success')
      resetNewWord()
    } catch (error) {
      console.error('Failed to add word:', error)
      showSnackbar('답안 추가에 실패했습니다.', 'error')
    }
  }

  return {
    handleAddSubject,
    handleAddWord
  }
}