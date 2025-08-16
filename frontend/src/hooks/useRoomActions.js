import {validateFormData} from '../utils/roomUtils'
import {useNavigate} from 'react-router-dom'

/**
 * Custom hook for room-related business logic
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.createRoomMutation - Create room mutation function
 * @param {Function} dependencies.joinRoomMutation - Join room mutation function
 * @param {Function} dependencies.logout - Logout function
 * @param {Function} dependencies.fetchRooms - Fetch rooms function
 * @param {Function} dependencies.showSnackbar - Show snackbar function
 * @param {Function} dependencies.closeCreateRoomDialog - Close create room dialog function
 * @param {Function} dependencies.closeJoinRoomDialog - Close join room dialog function
 * @param {Function} dependencies.closeLogoutDialog - Close logout dialog function
 * @param {Object} dependencies.currentUser - Current user object
 * @returns {Object} Object containing room action functions
 */
export const useRoomActions = ({
  createRoomMutation,
  joinRoomMutation,
  logout,
  fetchRooms,
  showSnackbar,
  closeCreateRoomDialog,
  closeJoinRoomDialog,
  closeLogoutDialog,
  currentUser
}) => {
  const navigate = useNavigate()
  /**
   * Handle room creation
   * @param {Object} roomForm - Room form data
   * @param {Function} resetRoomForm - Function to reset room form
   * @param {Function} getRoomData - Function to get formatted room data
   */
  const handleCreateRoom = async (roomForm, resetRoomForm, getRoomData) => {
    const validationErrors = validateFormData(roomForm)
    
    if (validationErrors.length > 0) {
      showSnackbar(validationErrors.join('\n'), 'error')
      return
    }

    const roomData = getRoomData()
    
    console.log('[DEBUG_LOG] Creating room with data:', roomData)
    
    createRoomMutation.mutate(roomData, {
      onSuccess: () => {
        closeCreateRoomDialog()
        showSnackbar('방이 성공적으로 생성되었습니다.', 'success')
        resetRoomForm()
        // Navigate to game room after successful creation
        navigate('/game')
      },
      onError: (error) => {
        console.error('Failed to create room:', error)
        
        // 에러 메시지 파싱 및 사용자 친화적 메시지 표시
        let errorMessage = '방 생성에 실패했습니다.'
        
        if (error.response?.data?.message) {
          const backendError = error.response.data.message
          if (backendError.includes('참가자는')) {
            errorMessage = '참가자 수는 3명에서 15명 사이로 설정해주세요.'
          } else if (backendError.includes('라운드')) {
            errorMessage = '라운드 수를 확인해주세요.'
          }
        }
        
        showSnackbar(errorMessage, 'error')
      }
    })
  }

  /**
   * Handle joining a room
   * @param {Object} selectedRoom - Selected room object
   * @param {string} joinPassword - Join password
   * @param {Function} resetJoinPassword - Function to reset join password
   */
  const handleJoinRoom = async (selectedRoom, joinPassword, resetJoinPassword) => {
    joinRoomMutation.mutate(
      { gameNumber: selectedRoom.gameNumber, password: joinPassword },
      {
        onSuccess: () => {
          closeJoinRoomDialog()
          resetJoinPassword()

          setTimeout(() => {
            fetchRooms()
          }, 1000)
        },
        onError: (error) => {
          console.error('Failed to join room:', error)
          showSnackbar(error.normalizedMessage || '방 참가에 실패했습니다.', 'error')
        }
      }
    )
  }

  /**
   * Handle user logout
   */
  const handleLogout = () => {
    console.log('[DEBUG_LOG] User logging out:', currentUser?.nickname)
    logout()
    closeLogoutDialog()
  }

  /**
   * Handle opening create room dialog with default title
   * @param {Function} setDefaultTitle - Function to set default title
   * @param {Function} openCreateRoomDialog - Function to open create room dialog
   */
  const handleOpenCreateRoom = (setDefaultTitle, openCreateRoomDialog) => {
    setDefaultTitle()
    openCreateRoomDialog()
  }

  return {
    handleCreateRoom,
    handleJoinRoom,
    handleLogout,
    handleOpenCreateRoom
  }
}