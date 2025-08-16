import React, {useCallback, useState} from 'react'
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Input as TextField,
    Typography
} from '@components/ui'
import {AlertTriangle as WarningIcon, Send as SendIcon, Timer as TimerIcon} from 'lucide-react'

const FORBIDDEN_WORDS = ['라이어', '라이어게임']
const MAX_HINT_LENGTH = 100

const HintPhase = React.memo(function HintPhase({
  gameTimer,
  assignedWord,
  currentUser,
  currentTurnPlayer,
  onSubmitHint,
  isSubmitted = false,
  isLoading = false,
  error = null,
  isMobile = false
}) {
  const [hint, setHint] = useState('')
  const [focused, setFocused] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const isMyTurn = currentUser?.id === currentTurnPlayer?.id
  
  // Check for forbidden words
  const forbiddenWordsFound = FORBIDDEN_WORDS.filter(word => 
    hint.toLowerCase().includes(word.toLowerCase())
  )
  const hasForbiddenWords = forbiddenWordsFound.length > 0
  
  // Character count validation
  const isOverLimit = hint.length > MAX_HINT_LENGTH
  const charactersLeft = MAX_HINT_LENGTH - hint.length
  
  const canSubmit = hint.trim().length > 0 && !hasForbiddenWords && !isOverLimit && !isSubmitted && !isLoading

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    setShowConfirmDialog(true)
  }, [canSubmit])

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmDialog(false)
    onSubmitHint?.(hint.trim())
    setHint('')
  }, [hint, onSubmitHint])

  const handleInputChange = useCallback((e) => {
    setHint(e.target.value)
  }, [])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault()
      handleSubmit()
    }
  }, [canSubmit, handleSubmit])

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      {/* Subject Word Card */}
      <Card
        elevation={3}
        sx={{
          mb: 3,
          p: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: 3,
          animation: 'slideDown 0.5s ease-out',
          '@keyframes slideDown': {
            '0%': { 
              opacity: 0,
              transform: 'translateY(-20px)'
            },
            '100%': { 
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={600}>
          주제어
        </Typography>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            letterSpacing: '2px'
          }}
        >
          {assignedWord || '???'}
        </Typography>
      </Card>

      {/* Turn Information */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Chip
          icon={<TimerIcon />}
          label={`${currentTurnPlayer?.nickname || '알 수 없음'}님의 차례`}
          color={isMyTurn ? 'primary' : 'default'}
          sx={{ 
            fontSize: '1rem',
            py: 1,
            px: 2,
            fontWeight: 600,
            ...(isMyTurn && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
              }
            })
          }}
        />
      </Box>

      {/* Hint Input Section */}
      {isMyTurn && (
        <Card elevation={2} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            힌트를 입력하세요
          </Typography>
          
          {/* Expandable Input Field */}
          <TextField
            fullWidth
            multiline
            rows={focused ? 3 : 1}
            value={hint}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => !hint && setFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder="주제어와 관련된 힌트를 입력하세요..."
            disabled={isSubmitted || isLoading}
            error={hasForbiddenWords || isOverLimit}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.3s ease',
                ...(focused && {
                  '& fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                })
              },
              '& .MuiInputBase-input': {
                fontSize: '1.1rem',
                transition: 'height 0.3s ease'
              }
            }}
          />

          {/* Character Counter and Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="body2"
              color={charactersLeft < 10 ? 'error' : 'text.secondary'}
              sx={{ fontWeight: 500 }}
            >
              {hint.length}/{MAX_HINT_LENGTH} 글자
              {charactersLeft < 10 && ` (${charactersLeft}글자 남음)`}
            </Typography>
            
            {hint.length > 0 && (
              <Box sx={{ 
                width: 100, 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: 'grey.200',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <Box sx={{
                  width: `${Math.min((hint.length / MAX_HINT_LENGTH) * 100, 100)}%`,
                  height: '100%',
                  backgroundColor: isOverLimit ? 'error.main' : 'primary.main',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            )}
          </Box>

          {/* Forbidden Words Warning */}
          {hasForbiddenWords && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              금지어가 포함되어 있습니다: {forbiddenWordsFound.join(', ')}
            </Alert>
          )}

          {/* Character Limit Warning */}
          {isOverLimit && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              글자 수 제한을 초과했습니다. ({hint.length}/{MAX_HINT_LENGTH})
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              ...(canSubmit && {
                background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 100%)',
                  transform: 'translateY(-1px)'
                }
              })
            }}
          >
            {isLoading ? '제출 중...' : isSubmitted ? '제출 완료' : '힌트 제출'}
          </Button>
        </Card>
      )}

      {/* Waiting for Others */}
      {!isMyTurn && (
        <Card 
          elevation={1} 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 3
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            다른 플레이어의 힌트를 기다리는 중...
          </Typography>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          힌트 제출 확인
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            다음 힌트를 제출하시겠습니까?
          </Typography>
          <Card sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              "{hint}"
            </Typography>
          </Card>
          <Alert severity="warning" sx={{ mt: 2 }}>
            제출 후에는 수정할 수 없습니다.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
            sx={{ fontWeight: 600 }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmSubmit}
            sx={{ fontWeight: 600 }}
          >
            제출
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
})

HintPhase.displayName = 'HintPhase'
export default HintPhase