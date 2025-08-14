import * as gameApi from './gameApi'

// Subject API functions
// This module handles only subject-related API calls

export const fetchAllSubjects = async () => {
  console.log('[DEBUG_LOG] Fetching subjects from API')
  const subjects = await gameApi.getAllSubjects()

  if (!Array.isArray(subjects)) {
    throw new Error('주제 목록을 불러오는데 실패했습니다.')
  }

  console.log('[DEBUG_LOG] Subjects loaded successfully:', subjects.length)
  return subjects
}

export const getSubjectById = async (subjectId, existingSubjects = []) => {
  try {
    // First check in existing subjects
    const subject = existingSubjects.find(s => s.id === subjectId)
    if (subject) return subject
    
    // If not found, fetch from API
    const allSubjects = await gameApi.getAllSubjects()
    const foundSubject = allSubjects.find(s => s.id === subjectId)
    return foundSubject || { id: subjectId, name: '알 수 없는 주제' }
  } catch (error) {
    console.error('Failed to get subject:', error)
    return { id: subjectId, name: '주제 오류' }
  }
}

export const createSubject = async (name) => {
  const newSubject = await gameApi.addSubject(name)
  console.log('[DEBUG_LOG] Subject added successfully - will be updated via WebSocket:', newSubject)
  return newSubject
}

export const createWord = async (subject, word) => {
  const result = await gameApi.addWord(subject, word)
  return result
}