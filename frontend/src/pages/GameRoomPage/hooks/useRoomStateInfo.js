import React, {useMemo} from 'react'

const ROOM_STATE_CONFIG = {
  WAITING: { color: 'success', text: '대기 중', icon: 'pause' },
  IN_PROGRESS: { color: 'warning', text: '진행 중', icon: 'play' },
  FINISHED: { color: 'default', text: '종료', icon: 'pause' },
}

export default function useRoomStateInfo(state) {
  return useMemo(() => {
    const config = ROOM_STATE_CONFIG[state] || ROOM_STATE_CONFIG.WAITING
    return {
      color: config.color,
      text: config.text,
      icon: React.createElement(IconCmp)
    }
  }, [state])
}
