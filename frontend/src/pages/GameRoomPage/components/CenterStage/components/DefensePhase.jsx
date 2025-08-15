import React, {useCallback, useState} from 'react'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    TextField,
    Typography
} from '@mui/material'
import {Gavel as DefenseIcon, Person as PersonIcon, Shield as ShieldIcon} from '@mui/icons-material'

const MAX_DEFENSE_LENGTH = 200

const DefensePhase = React.memo(function DefensePhase({
  gameTimer,
  accusedPlayer,
  currentUser,
  onSubmitDefense,
  isSubmitted = false,
  isLoading = false,
  error = null,
  isMobile = false
}) {
  const [defense, setDefense] = useState('')
  const [focused, setFocused] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  const isAccusedPlayer = currentUser?.id === accusedPlayer?.id
  
  // Character count validation
  const isOverLimit = defense.length > MAX_DEFENSE_LENGTH
  const charactersLeft = MAX_DEFENSE_LENGTH - defense.length
  
  const canSubmit = defense.trim().length > 0 && !isOverLimit && !isSubmitted && !isLoading && isAccusedPlayer

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    setShowConfirmDialog(true)
  }, [canSubmit])

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmDialog(false)
    onSubmitDefense?.(defense.trim())
    setDefense('')
  }, [defense, onSubmitDefense])

  const handleInputChange = useCallback((e) => {
    setDefense(e.target.value)
  }, [])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault()
      handleSubmit()
    }
  }, [canSubmit, handleSubmit])

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto' }}>
      {/* Accused Player Header */}
      <Card
        elevation={3}
        sx={{
          mb: 3,
          p: 3,
          textAlign: 'center',
          background: isAccusedPlayer 
            ? 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' 
            : 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <DefenseIcon sx={{ fontSize: '2rem', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            변론 단계
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              backgroundColor: 'rgba(255,255,255,0.2)',
              fontSize: '1.5rem'
            }}
          >
            {accusedPlayer?.nickname?.[0] || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {accusedPlayer?.nickname || '알 수 없음'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              라이어로 지목됨
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Defense Status */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Chip
          icon={<ShieldIcon />}
          label={isAccusedPlayer ? '당신의 변론 차례입니다' : '변론을 기다리는 중...'}
          color={isAccusedPlayer ? 'error' : 'default'}
          sx={{ 
            fontSize: '1rem',
            py: 1,
            px: 2,
            fontWeight: 600,
            ...(isAccusedPlayer && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
              }
            })
          }}
        />
      </Box>

      {/* Defense Input Section */}
      {isAccusedPlayer && (
        <Card elevation={2} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🛡️ 변론을 작성하세요
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            당신이 라이어가 아님을 증명하세요. 구체적인 근거를 제시하면 더욱 설득력 있습니다.
          </Typography>
          
          {/* Expandable Defense Input */}
          <TextField
            fullWidth
            multiline
            rows={focused ? 4 : 2}
            value={defense}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => !defense && setFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder="예: '저는 주제어를 알고 있었기 때문에 구체적인 힌트를 줄 수 있었습니다. 제 힌트를 보시면...' "
            disabled={isSubmitted || isLoading}
            error={isOverLimit}
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
              color={charactersLeft < 20 ? 'error' : 'text.secondary'}
              sx={{ fontWeight: 500 }}
            >
              {defense.length}/{MAX_DEFENSE_LENGTH} 글자
              {charactersLeft < 20 && ` (${charactersLeft}글자 남음)`}
            </Typography>
            
            {defense.length > 0 && (
              <LinearProgress
                variant="determinate"
                value={(defense.length / MAX_DEFENSE_LENGTH) * 100}
                sx={{
                  width: 120,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: isOverLimit ? 'error.main' : 'success.main',
                    borderRadius: 3
                  }
                }}
              />
            )}
          </Box>

          {/* Character Limit Warning */}
          {isOverLimit && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              글자 수 제한을 초과했습니다. ({defense.length}/{MAX_DEFENSE_LENGTH})
            </Alert>
          )}

          {/* Tips */}
          {!defense && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                💡 효과적인 변론 팁:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>자신의 힌트가 주제어와 어떻게 연관되는지 설명</li>
                <li>다른 플레이어의 힌트에 대한 구체적인 분석</li>
                <li>실제 라이어가 누구인지에 대한 추론</li>
              </Typography>
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
            startIcon={<DefenseIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              ...(canSubmit && {
                background: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                  transform: 'translateY(-1px)'
                }
              })
            }}
          >
            {isLoading ? '제출 중...' : isSubmitted ? '제출 완료' : '변론 제출'}
          </Button>
        </Card>
      )}

      {/* Waiting for Defense */}
      {!isAccusedPlayer && (
        <Card 
          elevation={1} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 3
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2,
                backgroundColor: 'warning.light',
                fontSize: '2rem'
              }}
            >
              {accusedPlayer?.nickname?.[0] || <PersonIcon />}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {accusedPlayer?.nickname}님이 변론 중입니다
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              변론이 완료될 때까지 기다려주세요...
            </Typography>
          </Box>
          
          {/* Loading animation */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 2 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'warning.main',
                  animation: 'blink 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.5}s`,
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 0.3 },
                    '50%': { opacity: 1 }
                  }
                }}
              />
            ))}
          </Box>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          변론 제출 확인
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            다음 변론을 제출하시겠습니까?
          </Typography>
          <Card sx={{ p: 2, backgroundColor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {defense}
            </Typography>
          </Card>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              변론 제출 후에는 수정할 수 없습니다. 신중하게 작성했는지 확인하세요.
            </Typography>
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

DefensePhase.displayName = 'DefensePhase'
export default DefensePhase