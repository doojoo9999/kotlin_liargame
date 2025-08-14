import React from 'react'
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    TextField,
    Tooltip,
    Typography
} from '@mui/material'

const CreateRoomDialog = ({
  open,
  onClose,
  subjects,
  config,
  currentUser,
  roomForm,
  onFormChange,
  onSubmit,
  isLoading = false
}) => {
  const handleSubjectChange = (subjectId, checked) => {
    if (checked) {
      onFormChange('selectedSubjectIds', [...roomForm.selectedSubjectIds, subjectId])
    } else {
      onFormChange('selectedSubjectIds', roomForm.selectedSubjectIds.filter(id => id !== subjectId))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>새 방 만들기</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="방 제목"
            value={roomForm.title}
            onChange={(e) => onFormChange('title', e.target.value)}
            placeholder={currentUser ? `${currentUser.nickname}님의 방` : '방 제목을 입력하세요'}
            fullWidth
            sx={{
              '& .MuiInputBase-input::placeholder': {
                color: '#9e9e9e',
                opacity: 1
              }
            }}
          />
          
          <Box sx={{ px: 2, py: 1 }}>
            <Typography gutterBottom>
              참가자 수: {roomForm.maxPlayers}명
            </Typography>
            <Slider
              value={roomForm.maxPlayers}
              onChange={(e, value) => onFormChange('maxPlayers', value)}
              min={config.game.minPlayers}
              max={config.game.maxPlayers}
              step={1}
              marks={[
                { value: config.game.minPlayers, label: `${config.game.minPlayers}명` },
                { value: Math.floor((config.game.minPlayers + config.game.maxPlayers) / 2), label: `${Math.floor((config.game.minPlayers + config.game.maxPlayers) / 2)}명` },
                { value: config.game.maxPlayers, label: `${config.game.maxPlayers}명` }
              ]}
              valueLabelDisplay="auto"
              sx={{ mt: 2, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              최소 {config.game.minPlayers}명, 최대 {config.game.maxPlayers}명까지 설정 가능합니다.
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1 }}>
            <Typography gutterBottom>
              라운드 수: {roomForm.gTotalRounds}라운드
            </Typography>
            <Slider
              value={roomForm.gTotalRounds}
              onChange={(e, value) => onFormChange('gTotalRounds', value)}
              min={config.game.minRounds}
              max={config.game.maxRounds}
              step={1}
              marks={[
                { value: config.game.minRounds, label: `${config.game.minRounds}` },
                { value: config.game.defaultRounds, label: `${config.game.defaultRounds}` },
                { value: Math.floor((config.game.minRounds + config.game.maxRounds) / 2), label: `${Math.floor((config.game.minRounds + config.game.maxRounds) / 2)}` },
                { value: config.game.maxRounds, label: `${config.game.maxRounds}` }
              ]}
              valueLabelDisplay="auto"
              sx={{ mt: 2, mb: 1 }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              주제 선택 (여러 개 선택 가능)
            </Typography>
            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
              {subjects.map((subject, index) => {
                const wordCount = subject.wordIds ? subject.wordIds.length : (subject.word ? subject.word.length : 0)
                const isDisabled = wordCount < 5
                const isChecked = roomForm.selectedSubjectIds.includes(subject.id)
                
                const checkboxElement = (
                  <FormControlLabel
                    key={subject.id || `subject-${index}-${subject.name}`}
                    control={
                      <Checkbox
                        checked={isChecked}
                        onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                        disabled={isDisabled}
                      />
                    }
                    label={`${subject.name} (${wordCount}개 단어)`}
                    sx={{ 
                      width: '100%', 
                      opacity: isDisabled ? 0.5 : 1,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                )
                
                if (isDisabled) {
                  return (
                    <Tooltip 
                      key={subject.id || `subject-${index}-${subject.name}`}
                      title={`이 주제는 단어가 ${wordCount}개뿐입니다. 최소 5개의 단어가 필요합니다.`}
                      placement="right"
                    >
                      <Box>{checkboxElement}</Box>
                    </Tooltip>
                  )
                }
                
                return checkboxElement
              })}
              {subjects.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  사용 가능한 주제가 없습니다.
                </Typography>
              )}
            </Box>
            {roomForm.selectedSubjectIds.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {roomForm.selectedSubjectIds.length}개 주제 선택됨 - 게임 시작 시 랜덤으로 단어가 선택됩니다.
              </Typography>
            )}
          </Box>

          <FormControl fullWidth>
            <InputLabel>게임 모드</InputLabel>
            <Select
              value={roomForm.gameMode}
              onChange={(e) => onFormChange('gameMode', e.target.value)}
              label="게임 모드"
              variant="outlined"
            >
              <MenuItem value="LIAR_KNOWS">라이어가 자신이 라이어인 것을 아는 모드</MenuItem>
              <MenuItem value="LIAR_DIFFERENT_ANSWER">라이어가 시민과 다른 답을 보는 모드</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={roomForm.hasPassword}
                onChange={(e) => onFormChange('hasPassword', e.target.checked)}
              />
            }
            label="비밀방으로 설정"
          />

          {roomForm.hasPassword && (
            <TextField
              label="비밀번호"
              type="password"
              value={roomForm.password}
              onChange={(e) => onFormChange('password', e.target.value)}
              fullWidth
              required
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          disabled={!roomForm.title || isLoading}
        >
          {isLoading ? <CircularProgress size={20} /> : '방 만들기'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateRoomDialog