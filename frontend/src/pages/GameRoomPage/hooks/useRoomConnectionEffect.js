import {useEffect, useRef} from 'react'

export default function useRoomConnectionEffect({
  gameNumber,
  connectToRoom,
  disconnectSocket,
  addToast,
}) {

    const addToastRef = useRef(addToast)
    useEffect(() => {
        addToastRef.current = addToast;
    }, [addToast]);


  useEffect(() => {
    if (!gameNumber) {
      console.log('[DEBUG_LOG] No currentRoom or gameNumber available')
      return
    }

    const localGameNumber = gameNumber
    console.log('[DEBUG_LOG] Connecting to room:', localGameNumber)

    const debounceTimer = setTimeout(() => {
      const connectWithRetry = async () => {
        try {
          console.log('[DEBUG_LOG] Attempting to connect to room:', localGameNumber)
          await connectToRoom(localGameNumber)
          console.log('[DEBUG_LOG] Successfully connected to room:', localGameNumber)
        } catch (error) {
          console.error('[DEBUG_LOG] Failed to initialize room:', error)
          addToast('서버 연결에 실패했습니다. 게임 컨텍스트에서 재시도 중...', 'warning')
        }
      }

      connectWithRetry()
    }, 300)

    return () => {
      console.log('[DEBUG_LOG] GameRoomPage unmounting, disconnecting WebSocket')
      clearTimeout(debounceTimer)
      try {
        disconnectSocket()
      } catch (error) {
        console.error('[DEBUG_LOG] Failed to disconnect WebSocket on unmount:', error)
      }
    }
    // Intentionally do not include connectToRoom/disconnectSocket to preserve original behavior
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameNumber])
}
