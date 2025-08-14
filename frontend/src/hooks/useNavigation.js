import {useCallback} from 'react'
import {ACTION_TYPES, PAGES} from '../context/gameConstants'

export const useNavigation = (state, dispatch) => {
  // Navigate to lobby page
  const navigateToLobby = useCallback(() => {
    dispatch({ type: ACTION_TYPES.SET_CURRENT_PAGE, payload: PAGES.LOBBY })
    dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROOM })
  }, [dispatch])

  // Navigate to room page
  const navigateToRoom = useCallback(() => {
    dispatch({ type: ACTION_TYPES.SET_CURRENT_PAGE, payload: PAGES.ROOM })
  }, [dispatch])

  // Set current page directly
  const setCurrentPage = useCallback((page) => {
    dispatch({ type: ACTION_TYPES.SET_CURRENT_PAGE, payload: page })
  }, [dispatch])

  return {
    navigateToLobby,
    navigateToRoom,
    setCurrentPage,
    currentPage: state.currentPage
  }
}