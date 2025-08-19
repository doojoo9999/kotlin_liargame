import React from 'react'
import {
    Box,
    Button,
    Checkbox,
    Group,
    Loader,
    PasswordInput,
    ScrollArea,
    Select,
    Slider,
    Stack,
    Text,
    TextInput
} from '@mantine/core'
import {IconDice, IconLock, IconPlus, IconUsers} from '@tabler/icons-react'
import {GameModal} from '../../GameModal'


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
    <GameModal
      opened={open}
      onClose={onClose}
      title={
        <Group gap="sm" align="center">
          <IconPlus size={24} />
          <Text>새 방 만들기</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="16px">
        {/* Room Title */}
        <TextInput
          label="방 제목"
          placeholder="방 제목을 입력하세요"
          value={roomForm.title || (currentUser ? `${currentUser.nickname}님의 방` : '새로운 방')}
          onChange={(e) => onFormChange('title', e.target.value)}
          onFocus={(e) => {
            // 포커스 시 기본값이 없다면 설정
            if (!roomForm.title && currentUser) {
              const defaultTitle = `${currentUser.nickname}님의 방`
              onFormChange('title', defaultTitle)
            }
            // 약간의 지연 후 전체 선택
            setTimeout(() => e.target.select(), 50)
          }}
          styles={{
            input: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:focus': {
                borderColor: '#4ecdc4'
              }
            },
            label: {
              color: 'white',
              fontWeight: 500
            }
          }}
        />

        {/* Max Players Slider */}
        <Box>
          <Group gap="sm" mb="md">
            <IconUsers size={20} />
            <Text style={{ color: 'white' }}>
              참가자 수: {roomForm.maxPlayers}명
            </Text>
          </Group>
          <Slider
            value={roomForm.maxPlayers}
            onChange={(value) => onFormChange('maxPlayers', value)}
            onChangeEnd={(value) => onFormChange('maxPlayers', value)}
            min={config.game.minPlayers}
            max={config.game.maxPlayers}
            step={1}
            color="cyan"
            size="md"
            marks={[
              { value: config.game.minPlayers, label: `${config.game.minPlayers}` },
              { value: config.game.maxPlayers, label: `${config.game.maxPlayers}` }
            ]}
            styles={{
              track: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              bar: { backgroundColor: '#4ecdc4' },
              thumb: { backgroundColor: '#4ecdc4', borderColor: '#4ecdc4' },
              mark: { color: 'rgba(255, 255, 255, 0.6)' },
              markLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }
            }}
          />
          <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
            최소 {config.game.minPlayers}명, 최대 {config.game.maxPlayers}명까지 설정 가능합니다.
          </Text>
        </Box>

        {/* Rounds Slider */}
        <Box>
          <Group gap="sm" mb="md">
            <IconDice size={20} />
            <Text style={{ color: 'white' }}>
              라운드 수: {roomForm.gTotalRounds}라운드
            </Text>
          </Group>
          <Slider
            value={roomForm.gTotalRounds}
            onChange={(value) => onFormChange('gTotalRounds', value)}
            onChangeEnd={(value) => onFormChange('gTotalRounds', value)}
            min={config.game.minRounds}
            max={config.game.maxRounds}
            step={1}
            color="violet"
            size="md"
            marks={[
              { value: config.game.minRounds, label: `${config.game.minRounds}` },
              { value: config.game.maxRounds, label: `${config.game.maxRounds}` }
            ]}
            styles={{
              track: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              bar: { backgroundColor: '#9775fa' },
              thumb: { backgroundColor: '#9775fa', borderColor: '#9775fa' },
              mark: { color: 'rgba(255, 255, 255, 0.6)' },
              markLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }
            }}
          />
        </Box>

        {/* Subject Selection */}
        <Box>
          <Text style={{ color: 'white', marginBottom: '12px', fontWeight: 500 }}>
            주제 선택 (여러 개 선택 가능)
          </Text>
          <ScrollArea 
            h={200} 
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '12px'
            }}
          >
            <Stack gap="xs">
              {subjects.map((subject, index) => {
                const wordCount = subject.wordIds ? subject.wordIds.length : (subject.word ? subject.word.length : 0)
                const isDisabled = wordCount < 5
                const isChecked = roomForm.selectedSubjectIds.includes(subject.id)
                
                return (
                  <Checkbox
                    key={subject.id || `subject-${index}-${subject.name}`}
                    checked={isChecked}
                    onChange={(e) => handleSubjectChange(subject.id, e.currentTarget.checked)}
                    disabled={isDisabled}
                    label={
                      <Text size="sm" style={{ 
                        color: isDisabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.8)' 
                      }}>
                        {subject.name} ({wordCount}개 단어)
                      </Text>
                    }
                    styles={{
                      input: {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        '&:checked': {
                          backgroundColor: '#4ecdc4',
                          borderColor: '#4ecdc4'
                        }
                      }
                    }}
                    title={isDisabled ? `이 주제는 단어가 ${wordCount}개뿐입니다. 최소 5개의 단어가 필요합니다.` : ''}
                  />
                )
              })}
              {subjects.length === 0 && (
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '16px' }}>
                  사용 가능한 주제가 없습니다.
                </Text>
              )}
            </Stack>
          </ScrollArea>
          {roomForm.selectedSubjectIds.length > 0 && (
            <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
              {roomForm.selectedSubjectIds.length}개 주제 선택됨 - 게임 시작 시 랜덤으로 단어가 선택됩니다.
            </Text>
          )}
        </Box>

        {/* Game Mode Selection */}
        <Box>
          <Text style={{ color: 'white', marginBottom: '4px', fontWeight: 500 }}>게임 모드</Text>
          <Select
            value={roomForm.gameMode}
            onChange={(value) => onFormChange('gameMode', value)}
            data={[
              { value: 'LIARS_KNOW', label: '라이어가 자신이 라이어인 것을 아는 모드' },
              { value: 'LIARS_DIFFERENT_WORD', label: '라이어가 시민과 다른 답을 보는 모드' }
            ]}
            
            offset={4}
            mb="0"
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                marginBottom: '0',
                '&:focus': {
                  borderColor: '#4ecdc4'
                }
              },
              dropdown: {
                backgroundColor: 'rgba(45, 55, 72, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginTop: '4px'
              },
              option: {
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }}
          />
        </Box>

        {/* Password Setting */}
        <Checkbox
          checked={roomForm.hasPassword}
          onChange={(e) => onFormChange('hasPassword', e.currentTarget.checked)}
          label={
            <Group gap="xs">
              <IconLock size={16} />
              <Text style={{ color: 'white' }}>비밀방으로 설정</Text>
            </Group>
          }
          styles={{
            input: {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:checked': {
                backgroundColor: '#4ecdc4',
                borderColor: '#4ecdc4'
              }
            }
          }}
        />

        {roomForm.hasPassword && (
          <PasswordInput
            label="비밀번호"
            value={roomForm.password}
            onChange={(e) => onFormChange('password', e.target.value)}
            required
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:focus': {
                  borderColor: '#4ecdc4'
                }
              },
              label: {
                color: 'white',
                fontWeight: 500
              },
              innerInput: {
                color: 'white'
              }
            }}
          />
        )}

        {/* Action Buttons */}
        <Group justify="center" gap="md" mt="lg">
          <Button
            variant="outline"
            onClick={onClose}
            size="md"
            styles={{
              root: {
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }}
          >
            취소
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan' }}
            onClick={onSubmit}
            disabled={isLoading || roomForm.selectedSubjectIds.length === 0}
            size="md"
            leftSection={isLoading ? <Loader size={20} /> : <IconPlus size={20} />}
            style={{
              fontWeight: 'bold',
              minWidth: 120
            }}
          >
            {isLoading ? '생성 중...' : '방 만들기'}
          </Button>
        </Group>
      </Stack>
    </GameModal>
  )
}

export default CreateRoomDialog