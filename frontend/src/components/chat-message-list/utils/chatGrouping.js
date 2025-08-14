/**
 * Chat message grouping and flattening utilities
 * Extracted from ChatMessageList for better separation of concerns
 */

// 메시지 그룹핑 함수
export const groupMessages = (messages) => {
  const groups = []
  let currentGroup = null
  
  messages.forEach((message, index) => {
    const isSystem = message.isSystem || message.type === 'announcement'
    const senderId = message.playerId || message.playerNickname || message.sender
    const prevMessage = messages[index - 1]
    const prevSenderId = prevMessage ? (prevMessage.playerId || prevMessage.playerNickname || prevMessage.sender) : null
    
    // 시스템 메시지는 항상 독립 그룹
    if (isSystem) {
      if (currentGroup) {
        groups.push(currentGroup)
        currentGroup = null
      }
      groups.push({
        senderId: 'system',
        senderName: 'System',
        messages: [{ ...message, isFirst: true, isLast: true }],
        isSystem: true
      })
      return
    }
    
    // 새로운 그룹 시작 조건
    const shouldStartNewGroup = !currentGroup || 
      currentGroup.senderId !== senderId ||
      (message.timestamp && currentGroup.lastTimestamp && 
       new Date(message.timestamp) - new Date(currentGroup.lastTimestamp) > 60000) // 1분 이상 차이
    
    if (shouldStartNewGroup) {
      if (currentGroup) {
        // 이전 그룹의 마지막 메시지 표시
        currentGroup.messages[currentGroup.messages.length - 1].isLast = true
        groups.push(currentGroup)
      }
      
      currentGroup = {
        senderId,
        senderName: message.playerNickname || message.sender || '익명',
        messages: [{ ...message, isFirst: true, isLast: false }],
        lastTimestamp: message.timestamp
      }
    } else {
      // 기존 그룹에 메시지 추가
      currentGroup.messages.push({ ...message, isFirst: false, isLast: false })
      currentGroup.lastTimestamp = message.timestamp
    }
  })
  
  // 마지막 그룹 처리
  if (currentGroup) {
    currentGroup.messages[currentGroup.messages.length - 1].isLast = true
    groups.push(currentGroup)
  }
  
  return groups
}

// 그룹을 플랫한 메시지 리스트로 변환
export const flattenGroups = (groups) => {
  const flatMessages = []
  
  groups.forEach(group => {
    group.messages.forEach(message => {
      flatMessages.push({
        ...message,
        groupInfo: {
          senderId: group.senderId,
          senderName: group.senderName,
          isSystem: group.isSystem || false
        }
      })
    })
  })
  
  return flatMessages
}