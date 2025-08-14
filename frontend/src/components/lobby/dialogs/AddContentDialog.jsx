import React from 'react'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'

const AddContentDialog = ({
  open,
  onClose,
  subjects,
  contentForm,
  onFormChange,
  onAddSubject,
  onAddWord,
  isLoading = false
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>주제/답안 추가</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          {/* Subject Addition Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              새 주제 추가
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="주제 이름"
                value={contentForm.newSubject}
                onChange={(e) => onFormChange('newSubject', e.target.value)}
                placeholder="예: 음식, 동물, 직업"
                fullWidth
              />
              <Button
                variant="contained"
                onClick={onAddSubject}
                disabled={isLoading || !contentForm.newSubject.trim()}
                sx={{ minWidth: '100px' }}
              >
                {isLoading ? <CircularProgress size={20} /> : '추가'}
              </Button>
            </Box>
          </Box>

          {/* Word Addition Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              답안 추가
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>주제 선택</InputLabel>
                <Select
                  value={contentForm.selectedSubject}
                  onChange={(e) => onFormChange('selectedSubject', e.target.value)}
                  label="주제 선택"
                  variant="outlined"
                >
                  {subjects.map((subject) => (
                    <MenuItem key={`room-${subject.id}-${subject.name}`} value={subject.id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label="답안"
                  value={contentForm.newWord}
                  onChange={(e) => onFormChange('newWord', e.target.value)}
                  placeholder="답안을 입력하세요"
                  fullWidth
                  disabled={!contentForm.selectedSubject}
                />
                <Button
                  variant="contained"
                  onClick={onAddWord}
                  disabled={isLoading || !contentForm.selectedSubject || !contentForm.newWord.trim()}
                  sx={{ minWidth: '100px' }}
                >
                  {isLoading ? <CircularProgress size={20} /> : '추가'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddContentDialog