import React from 'react'
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from '@mui/material'

const LogoutDialog = ({ open, onClose, onConfirm, currentUser }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>로그아웃</DialogTitle>
      <DialogContent>
        <Typography>
          정말로 로그아웃하시겠습니까?
          {currentUser && (
            <Box component="span" sx={{ display: 'block', mt: 1, fontWeight: 'medium' }}>
              {currentUser.nickname}님의 세션이 종료됩니다.
            </Box>
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
        >
          로그아웃
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default LogoutDialog