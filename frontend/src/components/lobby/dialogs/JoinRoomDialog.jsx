import React from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography
} from '@mui/material'

const JoinRoomDialog = ({
  open,
  onClose,
  selectedRoom,
  joinPassword,
  onPasswordChange,
  onSubmit,
  isLoading = false
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>방 입장</DialogTitle>
      <DialogContent>
        {selectedRoom && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" gutterBottom>
              {selectedRoom.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              방장: {selectedRoom.host} | 인원: {selectedRoom.playerCount}/{selectedRoom.maxPlayers}
            </Typography>
            
            {selectedRoom.hasPassword && (
              <TextField
                label="비밀번호"
                type="password"
                value={joinPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                fullWidth
                sx={{ mt: 2 }}
                required
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={20} /> : '입장'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default JoinRoomDialog