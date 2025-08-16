import {create} from 'zustand'
import {subscribeWithSelector} from 'zustand/middleware'
import * as gameApi from '../api/gameApi'
import gameStompClient from '../socket/gameStompClient'
import useAuthStore from './authStore'

const useSubjectStore = create(
  subscribeWithSelector((set, get) => ({
    // State
    subjects: [],
    loading: false,
    error: null,

    // Actions
    fetchSubjects: async (forceRefresh = false) => {
      const { loading, subjects } = get()
      
      // Prevent duplicate calls and skip if already has data (unless forced refresh)
      if (!forceRefresh && (loading || subjects.length > 0)) {
        console.log('[DEBUG_LOG] Skipping subjects fetch - already loading or has data')
        return
      }

      try {
        set({ loading: true, error: null })

        console.log('[DEBUG_LOG] Fetching subjects from API')
        const fetchedSubjects = await gameApi.getAllSubjects()

        if (Array.isArray(fetchedSubjects)) {
          // 가져온 주제 배열에서 중복 제거 (Map 사용하여 이름으로 중복 제거)
          const uniqueSubjectsMap = new Map()
          fetchedSubjects.forEach(subject => {
            if (subject && (subject.name || subject.content)) {
              const subjectName = subject.name || subject.content
              const processedSubject = {
                id: subject.id,
                name: subjectName,
                content: subject.content || subjectName,
                word: subject.word || [],
                wordIds: subject.wordIds || (subject.word ? subject.word.map(w => w.id) : [])
              }
              uniqueSubjectsMap.set(subjectName.toLowerCase(), processedSubject)
            }
          })

          const uniqueSubjects = Array.from(uniqueSubjectsMap.values())
          console.log('[DEBUG_LOG] Filtered unique subjects:', uniqueSubjects.length, '/', fetchedSubjects.length)
          console.log('[DEBUG_LOG] Sample subject with word count:', uniqueSubjects[0])

          set({ subjects: uniqueSubjects })
          console.log('[DEBUG_LOG] Subjects loaded successfully:', uniqueSubjects.length)
        } else {
          set({ error: '주제 목록을 불러오는데 실패했습니다.' })
        }

      } catch (error) {
        console.error('Failed to fetch subjects:', error)
        set({ error: '주제 목록을 불러오는데 실패했습니다.' })
      } finally {
        set({ loading: false })
      }
    },

    getSubjectById: async (subjectId) => {
      try {
        // First check local state
        const subject = get().subjects.find(s => s.id === subjectId)
        if (subject) return subject
        
        // If not found locally, fetch from API
        const allSubjects = await gameApi.getAllSubjects()
        const foundSubject = allSubjects.find(s => s.id === subjectId)
        return foundSubject || { id: subjectId, name: '알 수 없는 주제' }
      } catch (error) {
        console.error('Failed to get subject:', error)
        return { id: subjectId, name: '주제 오류' }
      }
    },

    addSubject: async (name) => {
      try {
        set({ loading: true, error: null })

        // 이미 같은 이름의 주제가 있는지 확인
        const { subjects } = get()
        const existingSubject = subjects.find(s => 
          s.name.toLowerCase() === name.toLowerCase()
        )

        if (existingSubject) {
          console.log('[DEBUG_LOG] Subject already exists, using existing:', existingSubject)
          set({ loading: false })
          return existingSubject
        }

        const newSubject = await gameApi.addSubject(name)
        console.log('[DEBUG_LOG] Subject added successfully - will be updated via WebSocket:', newSubject)

          // 중복 방지를 위해 Store에도 즉시 추가 (WebSocket 업데이트 전에 중복 API 호출 방지)
          const updatedSubjects = [...subjects];
          const alreadyAdded = updatedSubjects.some(s => s.id === newSubject.id);

          if (!alreadyAdded) {
            // Ensure new subject has proper word count structure
            const processedNewSubject = {
              id: newSubject.id,
              name: newSubject.name || newSubject.content,
              content: newSubject.content || newSubject.name,
              word: newSubject.word || [],
              wordIds: newSubject.wordIds || []
            }
            updatedSubjects.push(processedNewSubject);
            set({ subjects: updatedSubjects, loading: false });
          } else {
            console.log('[DEBUG_LOG] Subject already added to store');
            set({ loading: false });
          }

          return newSubject;
      } catch (error) {
        console.error('Failed to add subject:', error)
        set({ 
          error: '주제 추가에 실패했습니다.',
          loading: false 
        })
        throw error
      }
    },

    addWord: async (subject, word) => {
      try {
        set({ loading: true, error: null })
        
        const result = await gameApi.addWord(subject, word)
        
        // After successfully adding a word, refresh subjects to get updated word counts
        console.log('[DEBUG_LOG] Word added successfully, refreshing subjects to update counts')
        
        // Fetch updated subjects from API
        const updatedSubjects = await gameApi.getAllSubjects()
        
        if (Array.isArray(updatedSubjects)) {
          // Process subjects with word count information
          const uniqueSubjectsMap = new Map()
          updatedSubjects.forEach(subjectItem => {
            if (subjectItem && (subjectItem.name || subjectItem.content)) {
              const subjectName = subjectItem.name || subjectItem.content
              const processedSubject = {
                id: subjectItem.id,
                name: subjectName,
                content: subjectItem.content || subjectName,
                word: subjectItem.word || [],
                wordIds: subjectItem.wordIds || (subjectItem.word ? subjectItem.word.map(w => w.id) : [])
              }
              uniqueSubjectsMap.set(subjectName.toLowerCase(), processedSubject)
            }
          })

          const uniqueSubjects = Array.from(uniqueSubjectsMap.values())
          
          // Update subjects in store with new word counts
          set({ subjects: uniqueSubjects, loading: false })
          
          console.log('[DEBUG_LOG] Subjects refreshed after adding word')
          
          // Find and log the updated subject
          const updatedSubject = uniqueSubjects.find(s => 
            (s.name && s.name.toLowerCase() === subject.toLowerCase()) ||
            (s.content && s.content.toLowerCase() === subject.toLowerCase())
          )
          if (updatedSubject) {
            console.log('[DEBUG_LOG] Updated subject word count:', updatedSubject.word?.length || 0)
          }
        } else {
          set({ loading: false })
        }
        
        return result
      } catch (error) {
        console.error('Failed to add word:', error)
        set({ 
          error: '답안 추가에 실패했습니다.',
          loading: false 
        })
        throw error
      }
    },

    // Handle WebSocket subject updates
    handleSubjectUpdate: (message) => {
      console.log('[DEBUG_LOG] Global subject update received:', message)

      if (message.type === 'SUBJECT_ADDED') {
        const { subjects } = get()

        // 주제 이름으로 중복 확인 (ID는 다를 수 있음)
        const subjectName = message.subject.name || message.subject.content
        const existingSubjectIndex = subjects.findIndex(s => 
          s.name.toLowerCase() === subjectName.toLowerCase()
        )

        if (existingSubjectIndex !== -1) {
          // 기존 주제가 있으면 업데이트만 하고 중복 추가하지 않음
          console.log('[DEBUG_LOG] Subject already exists, updating:', message.subject)

          // 기존 항목 제거 후 새 항목 추가 (업데이트)
          const updatedSubjects = [...subjects]
          updatedSubjects[existingSubjectIndex] = {
            id: message.subject.id,
            name: subjectName,
            content: message.subject.content || subjectName,
            word: message.subject.word || updatedSubjects[existingSubjectIndex].word || [],
            wordIds: message.subject.wordIds || updatedSubjects[existingSubjectIndex].wordIds || []
          }

          set({ subjects: updatedSubjects })
        } else {
          // 새 주제 추가
          const newSubject = {
            id: message.subject.id,
            name: subjectName,
            content: message.subject.content || subjectName,
            word: message.subject.word || [],
            wordIds: message.subject.wordIds || []
          }

          set(state => ({
            subjects: [...state.subjects, newSubject]
          }))

          console.log('[DEBUG_LOG] New subject added via WebSocket:', newSubject)
        }
      } else if (message.type === 'WORD_ADDED' || message.type === 'SUBJECT_UPDATED') {
        // Handle word additions or subject updates
        console.log('[DEBUG_LOG] Word/Subject update received, refreshing subjects')
        
        // Refresh subjects to get updated word counts (force refresh)
        get().fetchSubjects(true)
      }
    },

    // Search and filter functions
    searchSubjects: (query) => {
      const { subjects } = get()
      if (!query) return subjects
      
      return subjects.filter(subject =>
        subject.name.toLowerCase().includes(query.toLowerCase())
      )
    },

    getSubjectsByCategory: (category) => {
      const { subjects } = get()
      return subjects.filter(subject => subject.category === category)
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Reset store
    reset: () => {
      set({
        subjects: [],
        loading: false,
        error: null
      })
    }
  }))
)

// Subscribe to auth changes to handle cleanup on logout
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      useSubjectStore.getState().reset()
    } else {
      // Auto-fetch subjects when user logs in
      useSubjectStore.getState().fetchSubjects()
    }
  }
)

// Global WebSocket subscription for subject updates
let globalSubjectSubscription = null

const setupGlobalSubjectSubscription = async () => {
  const { isAuthenticated } = useAuthStore.getState()
  
  if (isAuthenticated && !globalSubjectSubscription) {
    try {
      // Check if gameStompClient is available and has the subscribe method
      if (!gameStompClient || typeof gameStompClient.subscribe !== 'function') {
        console.log('[DEBUG_LOG] GameStompClient not available or subscribe method not found, skipping subscription')
        return
      }

      // Check if gameStompClient is connected (if it has a connection check method)
      if (typeof gameStompClient.isClientConnected === 'function' && !gameStompClient.isClientConnected()) {
        console.log('[DEBUG_LOG] GameStompClient not connected, skipping subscription')
        return
      }

      console.log('[DEBUG_LOG] Setting up global subject updates subscription')
      
      // Subscribe to global subject updates
      globalSubjectSubscription = await gameStompClient.subscribe('/topic/subjects', (message) => {
        useSubjectStore.getState().handleSubjectUpdate(message)
      })

      console.log('[DEBUG_LOG] Global subject subscription established successfully')

    } catch (error) {
      console.error('[DEBUG_LOG] Failed to set up global subject subscription:', error)
      
      // Only retry if it's a connection-related error, not a missing method error
      if (error.message && !error.message.includes('is not a function')) {
        // Retry after a delay with limited attempts
        const retryAttempts = globalSubjectSubscription?.retryCount || 0
        if (retryAttempts < 3) {
          setTimeout(() => {
            const { isAuthenticated } = useAuthStore.getState()
            if (isAuthenticated && !globalSubjectSubscription) {
              console.log('[DEBUG_LOG] Retrying global subject subscription... Attempt:', retryAttempts + 1)
              globalSubjectSubscription = { retryCount: retryAttempts + 1 }
              setupGlobalSubjectSubscription()
            }
          }, 10000) // Increase delay to 10 seconds
        } else {
          console.log('[DEBUG_LOG] Max retry attempts reached for global subject subscription')
        }
      }
    }
  }
}

const cleanupGlobalSubjectSubscription = () => {
  if (globalSubjectSubscription) {
    try {
      console.log('[DEBUG_LOG] Cleaning up global subject subscription')
      
      // Check if gameStompClient is available and has the unsubscribe method
      if (gameStompClient && typeof gameStompClient.unsubscribe === 'function') {
        gameStompClient.unsubscribe('/topic/subjects')
      } else {
        console.log('[DEBUG_LOG] GameStompClient not available for cleanup, skipping unsubscribe')
      }
    } catch (error) {
      console.error('[DEBUG_LOG] Error during global subject subscription cleanup:', error)
    } finally {
      globalSubjectSubscription = null
    }
  }
}

// Subscribe to auth changes to manage global subscription
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      setupGlobalSubjectSubscription()
    } else {
      cleanupGlobalSubjectSubscription()
    }
  }
)

// Initialize subscription if already authenticated
if (useAuthStore.getState().isAuthenticated) {
  setupGlobalSubjectSubscription()
}

export default useSubjectStore