// Room utility functions

/**
 * Get the color for room state chip
 * @param {string} state - Room state (WAITING, IN_PROGRESS, FINISHED)
 * @returns {string} - Material-UI color variant
 */
export const getRoomStateColor = (state) => {
  switch (state) {
    case 'WAITING':
      return 'success'
    case 'IN_PROGRESS':
      return 'warning'
    case 'FINISHED':
      return 'default'
    default:
      return 'default'
  }
}

/**
 * Get the display text for room state
 * @param {string} state - Room state (WAITING, IN_PROGRESS, FINISHED)
 * @returns {string} - Display text in Korean
 */
export const getRoomStateText = (state) => {
  switch (state) {
    case 'WAITING':
      return '대기 중'
    case 'IN_PROGRESS':
      return '진행 중'
    case 'FINISHED':
      return '종료'
    default:
      return state
  }
}

/**
 * Validate room creation form data
 * @param {Object} data - Form data object
 * @param {string} data.title - Room title
 * @param {number} data.maxPlayers - Maximum players
 * @param {number} data.gTotalRounds - Total rounds
 * @param {Array} data.selectedSubjectIds - Selected subject IDs
 * @returns {Array} - Array of validation error messages
 */
export const validateFormData = (data) => {
  const errors = []
  
  // Title is now optional - removed validation
  
  if (data.maxPlayers < 3 || data.maxPlayers > 15) {
    errors.push('참가자는 3명에서 15명 사이로 설정해주세요.')
  }
  
  if (data.gTotalRounds < 1 || data.gTotalRounds > 10) {
    errors.push('라운드는 1라운드에서 10라운드 사이로 설정해주세요.')
  }
  
  if (!data.selectedSubjectIds || data.selectedSubjectIds.length === 0) {
    errors.push('주제를 하나 이상 선택해주세요.')
  }
  
  return errors
}