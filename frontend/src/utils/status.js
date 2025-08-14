// src/utils/status.js
export const getRoomStatusColor = (status) => {
  switch (status) {
    case 'WAITING': return 'warning'
    case 'IN_PROGRESS': return 'success'
    case 'FINISHED': return 'default'
    default: return 'default'
  }
}

export const getRoomStatusText = (status) => {
  switch (status) {
    case 'WAITING': return '대기중'
    case 'IN_PROGRESS': return '진행중'
    case 'FINISHED': return '종료됨'
    default: return status
  }
}