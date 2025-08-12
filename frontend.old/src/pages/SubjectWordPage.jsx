import React, {useEffect, useState} from 'react'
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material'
import {Add as AddIcon, Delete as DeleteIcon, Quiz as QuizIcon, Subject as SubjectIcon} from '@mui/icons-material'
import apiClient from '../api/apiClient'

function SubjectWordPage() {
  // State for subjects
  const [subjects, setSubjects] = useState([])
  const [subjectForm, setSubjectForm] = useState({ content: '' })
  const [subjectLoading, setSubjectLoading] = useState(false)

  // State for words
  const [words, setWords] = useState([])
  const [wordForm, setWordForm] = useState({ subject: '', word: '' })
  const [wordLoading, setWordLoading] = useState(false)

  // UI state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, name: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [loading, setLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadSubjects(), loadWords()])
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to load data:', error)
      showSnackbar('데이터 로딩에 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      console.log('[DEBUG_LOG] Loading subjects...')
      const response = await apiClient.get('/subjects/listsubj')

      // 주제 중복 제거 로직 추가
      if (Array.isArray(response.data)) {
        const subjectMap = new Map()

        // 주제 이름을 기준으로 중복 제거 (같은 이름은 마지막 항목만 유지)
        response.data.forEach(subject => {
          if (subject && subject.content) {
            const key = subject.content.toLowerCase()
            subjectMap.set(key, subject)
          }
        })

        // 맵에서 고유한 주제만 배열로 변환
        const uniqueSubjects = Array.from(subjectMap.values())
        console.log('[DEBUG_LOG] Found unique subjects:', uniqueSubjects.length, '/', response.data.length)

        setSubjects(uniqueSubjects)
      } else {
        setSubjects([])
      }

      console.log('[DEBUG_LOG] Subjects loaded:', response.data?.length || 0)
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to load subjects:', error)
      throw error
    }
  }

  const loadWords = async () => {
    try {
      console.log('[DEBUG_LOG] Loading words...')
      const response = await apiClient.get('/words/wlist')
      setWords(response.data)
      console.log('[DEBUG_LOG] Words loaded:', response.data)
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to load words:', error)
      throw error
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Subject operations
  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    
    if (!subjectForm.content.trim()) {
      showSnackbar('주제를 입력해주세요.', 'error')
      return
    }

    // 중복 주제 검사
    const subjectName = subjectForm.content.trim()
    const existingSubject = subjects.find(
      s => s.content && s.content.toLowerCase() === subjectName.toLowerCase()
    )

    if (existingSubject) {
      showSnackbar('이미 존재하는 주제입니다.', 'error')
      return
    }

    setSubjectLoading(true)
    try {
      console.log('[DEBUG_LOG] Adding subject:', subjectName)
      await apiClient.post('/subjects/applysubj', { content: subjectName })
      
      setSubjectForm({ content: '' })
      await loadSubjects()
      showSnackbar('주제가 성공적으로 추가되었습니다.')
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to add subject:', error)
      const errorMessage = error.response?.data?.message || '주제 추가에 실패했습니다.'
      showSnackbar(errorMessage, 'error')
    } finally {
      setSubjectLoading(false)
    }
  }

  const handleSubjectDelete = async (subjectId, subjectContent) => {
    try {
      console.log('[DEBUG_LOG] Deleting subject:', subjectId, subjectContent)
      await apiClient.delete(`/subjects/delsubj/${subjectId}`, {
        data: { content: subjectContent }
      })
      
      await Promise.all([loadSubjects(), loadWords()])
      showSnackbar('주제가 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to delete subject:', error)
      const errorMessage = error.response?.data?.message || '주제 삭제에 실패했습니다.'
      showSnackbar(errorMessage, 'error')
    }
  }

  // Word operations
  const handleWordSubmit = async (e) => {
    e.preventDefault()
    
    if (!wordForm.subject.trim() || !wordForm.word.trim()) {
      showSnackbar('주제와 답안을 모두 입력해주세요.', 'error')
      return
    }

    setWordLoading(true)
    try {
      console.log('[DEBUG_LOG] Adding word:', wordForm)
      await apiClient.post('/words/applyw', {
        subject: wordForm.subject.trim(),
        word: wordForm.word.trim()
      })
      
      setWordForm({ subject: '', word: '' })
      await loadWords()
      showSnackbar('답안이 성공적으로 추가되었습니다.')
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to add word:', error)
      const errorMessage = error.response?.data?.message || '답안 추가에 실패했습니다.'
      showSnackbar(errorMessage, 'error')
    } finally {
      setWordLoading(false)
    }
  }

  const handleWordDelete = async (wordId) => {
    try {
      console.log('[DEBUG_LOG] Deleting word:', wordId)
      await apiClient.delete(`/words/delw/${wordId}?wordId=${wordId}`)
      
      await loadWords()
      showSnackbar('답안이 성공적으로 삭제되었습니다.')
    } catch (error) {
      console.error('[DEBUG_LOG] Failed to delete word:', error)
      const errorMessage = error.response?.data?.message || '답안 삭제에 실패했습니다.'
      showSnackbar(errorMessage, 'error')
    }
  }

  // Delete dialog handlers
  const openDeleteDialog = (type, id, name) => {
    setDeleteDialog({ open: true, type, id, name })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, type: '', id: null, name: '' })
  }

  const confirmDelete = async () => {
    const { type, id, name } = deleteDialog
    closeDeleteDialog()

    if (type === 'subject') {
      await handleSubjectDelete(id, name)
    } else if (type === 'word') {
      await handleWordDelete(id)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          주제/답안 관리
        </Typography>
        <Typography>데이터를 불러오는 중...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <QuizIcon sx={{ color: '#ff6b6b' }} />
        주제/답안 관리
      </Typography>

      <Grid container spacing={4}>
        {/* Subject Management Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SubjectIcon />
              주제 관리
            </Typography>
            
            {/* Add Subject Form */}
            <Box component="form" onSubmit={handleSubjectSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="새 주제"
                value={subjectForm.content}
                onChange={(e) => setSubjectForm({ content: e.target.value })}
                disabled={subjectLoading}
                sx={{ mb: 2 }}
                placeholder="예: 동물, 음식, 영화 등"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={subjectLoading || !subjectForm.content.trim()}
                sx={{ backgroundColor: '#ff6b6b', '&:hover': { backgroundColor: '#ee5a24' } }}
              >
                {subjectLoading ? '추가 중...' : '주제 추가'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Subjects List */}
            <Typography variant="subtitle1" gutterBottom>
              등록된 주제 ({subjects.length}개)
            </Typography>
            
            {subjects.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                등록된 주제가 없습니다.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>주제</TableCell>
                      <TableCell align="center">답안 수</TableCell>
                      <TableCell align="center">작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subjects.map((subject, index) => (
                        <TableRow key={subject.id || `subject-row-${index}-${subject.content}`}>
                          <TableCell>{subject.content}</TableCell>
                          <TableCell align="center">
                            <Chip
                                label={subject.wordIds.length}
                                size="small"
                                color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                                color="error"
                                onClick={() => openDeleteDialog('subject', subject.id, subject.content)}
                                size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Word Management Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QuizIcon />
              답안 관리
            </Typography>
            
            {/* Add Word Form */}
            <Box component="form" onSubmit={handleWordSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="주제"
                value={wordForm.subject}
                onChange={(e) => setWordForm({ ...wordForm, subject: e.target.value })}
                disabled={wordLoading}
                sx={{ mb: 2 }}
                placeholder="답안이 속할 주제를 입력하세요"
              />
              <TextField
                fullWidth
                label="답안"
                value={wordForm.word}
                onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                disabled={wordLoading}
                sx={{ mb: 2 }}
                placeholder="예: 사자, 호랑이, 코끼리 등"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={wordLoading || !wordForm.subject.trim() || !wordForm.word.trim()}
                sx={{ backgroundColor: '#ff6b6b', '&:hover': { backgroundColor: '#ee5a24' } }}
              >
                {wordLoading ? '추가 중...' : '답안 추가'}
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Words List */}
            <Typography variant="subtitle1" gutterBottom>
              등록된 답안 ({words.length}개)
            </Typography>
            
            {words.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                등록된 답안이 없습니다.
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>주제</TableCell>
                      <TableCell>답안</TableCell>
                      <TableCell align="center">작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {words.map((word) => (
                      <TableRow key={word.id}>
                        <TableCell>
                          <Chip 
                            label={word.subjectContent} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{word.content}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => openDeleteDialog('word', word.id, word.content)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>삭제 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog.type === 'subject' 
              ? `주제 "${deleteDialog.name}"을(를) 삭제하시겠습니까? 이 주제에 속한 모든 답안도 함께 삭제됩니다.`
              : `답안 "${deleteDialog.name}"을(를) 삭제하시겠습니까?`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>취소</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default SubjectWordPage