import {useCallback} from 'react'
import * as gameApi from '../api/gameApi'
import {ACTION_TYPES, ERROR_KEYS, LOADING_KEYS} from '../context/gameConstants'

export const useSubjects = (state, dispatch) => {
  // Helper function to set loading state
  const setLoading = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: { type, value } })
  }, [dispatch])
  
  // Helper function to set error state
  const setError = useCallback((type, value) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { type, value } })
  }, [dispatch])

  // Fetch all subjects with caching logic
  const fetchSubjects = useCallback(async () => {
    // Skip if already loading or has data (caching logic)
    if (state.loading.subjects || state.subjects.length > 0) {
      console.log('[DEBUG_LOG] Skipping subjects fetch - already loading or has data')
      return
    }

    try {
      setLoading(LOADING_KEYS.SUBJECTS, true)
      setError(ERROR_KEYS.SUBJECTS, null)

      console.log('[DEBUG_LOG] Fetching subjects from API')
      const subjects = await gameApi.getAllSubjects()

      if (Array.isArray(subjects)) {
        dispatch({ type: ACTION_TYPES.SET_SUBJECTS, payload: subjects })
        console.log('[DEBUG_LOG] Subjects loaded successfully:', subjects.length)
      } else {
        setError(ERROR_KEYS.SUBJECTS, '주제 목록을 불러오는데 실패했습니다.')
      }

    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      setError(ERROR_KEYS.SUBJECTS, '주제 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(LOADING_KEYS.SUBJECTS, false)
    }
  }, [state.loading.subjects, state.subjects.length, dispatch, setLoading, setError])

  // Get subject by ID with fallback API call
  const getSubjectById = useCallback(async (subjectId) => {
    try {
      // First try to find in cached subjects
      const subject = state.subjects.find(s => s.id === subjectId)
      if (subject) return subject
      
      // Fallback to API call if not found in cache
      const allSubjects = await gameApi.getAllSubjects()
      const foundSubject = allSubjects.find(s => s.id === subjectId)
      return foundSubject || { id: subjectId, name: '알 수 없는 주제' }
    } catch (error) {
      console.error('Failed to get subject:', error)
      return { id: subjectId, name: '주제 오류' }
    }
  }, [state.subjects])

  // Add a new subject
  const addSubject = useCallback(async (name) => {
    try {
      setLoading(LOADING_KEYS.SUBJECTS, true)
      setError(ERROR_KEYS.SUBJECTS, null)

      const newSubject = await gameApi.addSubject(name)

      console.log('[DEBUG_LOG] Subject added successfully - will be updated via WebSocket:', newSubject)

      setLoading(LOADING_KEYS.SUBJECTS, false)
      return newSubject
    } catch (error) {
      console.error('Failed to add subject:', error)
      setError(ERROR_KEYS.SUBJECTS, '주제 추가에 실패했습니다.')
      setLoading(LOADING_KEYS.SUBJECTS, false)
      throw error
    }
  }, [dispatch, setLoading, setError])

  // Add a word to a subject
  const addWord = useCallback(async (subject, word) => {
    try {
      setLoading(LOADING_KEYS.SUBJECTS, true)
      setError(ERROR_KEYS.SUBJECTS, null)
      
      const result = await gameApi.addWord(subject, word)
      
      setLoading(LOADING_KEYS.SUBJECTS, false)
      return result
    } catch (error) {
      console.error('Failed to add word:', error)
      setError(ERROR_KEYS.SUBJECTS, '답안 추가에 실패했습니다.')
      setLoading(LOADING_KEYS.SUBJECTS, false)
      throw error
    }
  }, [setLoading, setError])

  // Add subject to state (for WebSocket updates)
  const handleAddSubjectToState = useCallback((subject) => {
    dispatch({ type: ACTION_TYPES.ADD_SUBJECT, payload: subject })
  }, [dispatch])

  return {
    fetchSubjects,
    getSubjectById,
    addSubject,
    addWord,
    handleAddSubjectToState,
    subjects: state.subjects,
    loading: state.loading[LOADING_KEYS.SUBJECTS],
    error: state.error[ERROR_KEYS.SUBJECTS]
  }
}