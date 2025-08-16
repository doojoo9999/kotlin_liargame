import React, {useState} from 'react'
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
    Input as TextField,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '../components/ui'
import {BookOpen as SubjectIcon, FileQuestion as QuizIcon, Plus as AddIcon, Trash2 as DeleteIcon} from 'lucide-react'
import {useQuery} from '@tanstack/react-query'
import apiClient from '../api/apiClient'

function SubjectWordPage() {
  // React Query hooks for data fetching
  const { 
    data: subjects = [], 
    isLoading: subjectsLoading, 
    error: subjectsError,
    refetch: refetchSubjects 
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await apiClient.get('/subjects')
      return response.data.subjects || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
  
  const { 
    data: words = [], 
    isLoading: wordsLoading, 
    error: wordsError,
    refetch: refetchWords 
  } = useQuery({
    queryKey: ['words'],
    queryFn: async () => {
      const response = await apiClient.get('/words')
      return response.data.words || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Form state
  const [subjectForm, setSubjectForm] = useState({ content: '' })
  const [subjectLoading, setSubjectLoading] = useState(false)
  const [wordForm, setWordForm] = useState({ subject: '', word: '' })
  const [wordLoading, setWordLoading] = useState(false)

  // UI state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: '', id: null, name: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // Computed loading state - combines both queries
  const loading = subjectsLoading || wordsLoading

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Handle query errors
  if (subjectsError && !snackbar.open) {
    console.error('[DEBUG_LOG] Failed to load subjects:', subjectsError)
    showSnackbar('주제 데이터를 불러오는데 실패했습니다.', 'error')
  }
  
  if (wordsError && !snackbar.open) {
    console.error('[DEBUG_LOG] Failed to load words:', wordsError)
    showSnackbar('답안 데이터를 불러오는데 실패했습니다.', 'error')
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
      await refetchSubjects()
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
      
      await Promise.all([refetchSubjects(), refetchWords()])
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
      showSnackbar('주제와 답안을 모두 입력해 주세요.', 'error')
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
      await refetchWords()
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
      
      await refetchWords()
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
      <Container maxWidth="lg" style={{ marginTop: '32px', marginBottom: '32px' }}>
        <Typography variant="h4" style={{ marginBottom: '16px' }}>
          주제/답안 관리
        </Typography>
        <Typography>데이터를 불러오는 중...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" style={{ marginTop: '32px', marginBottom: '32px' }}>
      <Box $display="flex" $alignItems="center" $gap="16px" $marginBottom="16px">
        <QuizIcon size={24} style={{ color: '#ff6b6b' }} />
        <Typography variant="h4">
          주제/답안 관리
        </Typography>
      </Box>

      <Box $display="flex" $flexDirection="row" $gap="32px" $flexWrap="wrap">
        {/* Subject Management Section */}
        <Box $flex="1" $minWidth="300px">
          <Paper style={{ padding: '24px' }}>
            <Box $display="flex" $alignItems="center" $gap="8px" $marginBottom="16px">
              <SubjectIcon size={20} />
              <Typography variant="h6">
                주제 관리
              </Typography>
            </Box>
            
            {/* Add Subject Form */}
            <Box component="form" onSubmit={handleSubjectSubmit} $marginBottom="24px">
              <TextField
                label="새 주제"
                value={subjectForm.content}
                onChange={(e) => setSubjectForm({ content: e.target.value })}
                disabled={subjectLoading}
                style={{ marginBottom: '16px', width: '100%' }}
                placeholder="예: 동물, 음식, 영화 등"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={subjectLoading || !subjectForm.content.trim()}
                style={{ backgroundColor: '#ff6b6b' }}
              >
                {subjectLoading ? '추가 중...' : '주제 추가'}
              </Button>
            </Box>

            <Divider style={{ marginBottom: '16px' }} />

            {/* Subjects List */}
            <Typography variant="subtitle1" gutterBottom>
              등록된 주제 ({subjects.length}개)
            </Typography>
            
            {subjects.length === 0 ? (
              <Typography style={{ color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center', padding: '16px 0' }}>
                등록된 주제가 없습니다.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
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
                            <Button
                                variant="text"
                                onClick={() => openDeleteDialog('subject', subject.id, subject.content)}
                                size="small"
                                style={{ color: '#f44336', minWidth: '32px', padding: '4px' }}
                            >
                              <DeleteIcon size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>

        {/* Word Management Section */}
        <Box $flex="1" $minWidth="300px">
          <Paper style={{ padding: '24px' }}>
            <Box $display="flex" $alignItems="center" $gap="8px" $marginBottom="16px">
              <QuizIcon size={20} />
              <Typography variant="h6">
                답안 관리
              </Typography>
            </Box>
            
            {/* Add Word Form */}
            <Box component="form" onSubmit={handleWordSubmit} $marginBottom="24px">
              <TextField
                label="주제"
                value={wordForm.subject}
                onChange={(e) => setWordForm({ ...wordForm, subject: e.target.value })}
                disabled={wordLoading}
                style={{ marginBottom: '16px', width: '100%' }}
                placeholder="답안이 속할 주제를 입력하세요"
              />
              <TextField
                label="답안"
                value={wordForm.word}
                onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })}
                disabled={wordLoading}
                style={{ marginBottom: '16px', width: '100%' }}
                placeholder="예: 사자, 호랑이, 코끼리 등"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<AddIcon />}
                disabled={wordLoading || !wordForm.subject.trim() || !wordForm.word.trim()}
                style={{ backgroundColor: '#ff6b6b' }}
              >
                {wordLoading ? '추가 중...' : '답안 추가'}
              </Button>
            </Box>

            <Divider style={{ marginBottom: '16px' }} />

            {/* Words List */}
            <Typography variant="subtitle1" gutterBottom>
              등록된 답안 ({words.length}개)
            </Typography>
            
            {words.length === 0 ? (
              <Typography style={{ color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center', padding: '16px 0' }}>
                등록된 답안이 없습니다.
              </Typography>
            ) : (
              <TableContainer style={{ maxHeight: '400px' }}>
                <Table>
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
                          <Button
                            variant="text"
                            onClick={() => openDeleteDialog('word', word.id, word.content)}
                            size="small"
                            style={{ color: '#f44336', minWidth: '32px', padding: '4px' }}
                          >
                            <DeleteIcon size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>

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
          style={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default SubjectWordPage