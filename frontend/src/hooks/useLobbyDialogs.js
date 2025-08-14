import {useState} from 'react'

/**
 * Custom hook for managing all lobby dialog states
 * @returns {Object} Object containing dialog states and control functions
 */
export const useLobbyDialogs = () => {
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [joinRoomOpen, setJoinRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [addContentOpen, setAddContentOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)
  const [gameRulesDialogOpen, setGameRulesDialogOpen] = useState(false)

  /**
   * Open create room dialog
   */
  const openCreateRoomDialog = () => setCreateRoomOpen(true)

  /**
   * Close create room dialog
   */
  const closeCreateRoomDialog = () => setCreateRoomOpen(false)

  /**
   * Open join room dialog with selected room
   * @param {Object} room - Room object to join
   */
  const openJoinRoomDialog = (room) => {
    setSelectedRoom(room)
    setJoinRoomOpen(true)
  }

  /**
   * Close join room dialog and clear selected room
   */
  const closeJoinRoomDialog = () => {
    setJoinRoomOpen(false)
    setSelectedRoom(null)
  }

  /**
   * Open logout confirmation dialog
   */
  const openLogoutDialog = () => setLogoutDialogOpen(true)

  /**
   * Close logout confirmation dialog
   */
  const closeLogoutDialog = () => setLogoutDialogOpen(false)

  /**
   * Open add content dialog
   */
  const openAddContentDialog = () => setAddContentOpen(true)

  /**
   * Close add content dialog
   */
  const closeAddContentDialog = () => setAddContentOpen(false)

  /**
   * Open help dialog
   */
  const openHelpDialog = () => setHelpDialogOpen(true)

  /**
   * Close help dialog
   */
  const closeHelpDialog = () => setHelpDialogOpen(false)

  /**
   * Open game rules dialog
   */
  const openGameRulesDialog = () => setGameRulesDialogOpen(true)

  /**
   * Close game rules dialog
   */
  const closeGameRulesDialog = () => setGameRulesDialogOpen(false)

  return {
    // States
    createRoomOpen,
    joinRoomOpen,
    selectedRoom,
    logoutDialogOpen,
    addContentOpen,
    helpDialogOpen,
    gameRulesDialogOpen,
    
    // Actions
    openCreateRoomDialog,
    closeCreateRoomDialog,
    openJoinRoomDialog,
    closeJoinRoomDialog,
    openLogoutDialog,
    closeLogoutDialog,
    openAddContentDialog,
    closeAddContentDialog,
    openHelpDialog,
    closeHelpDialog,
    openGameRulesDialog,
    closeGameRulesDialog
  }
}