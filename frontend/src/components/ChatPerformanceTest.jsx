import React, {useEffect, useRef, useState} from 'react'
import {Box, Button, Chip, Grid, Input as TextField, Paper, Typography} from '@components/ui'
import OptimizedEnhancedChatSystem from './OptimizedEnhancedChatSystem'
import styled from 'styled-components'

// Styled components for controls
const ControlsContainer = styled(Paper)`
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`

const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
`

const CustomSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1976d2;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1976d2;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`

const SwitchContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`

const CustomSwitch = styled.input`
  position: relative;
  width: 44px;
  height: 24px;
  appearance: none;
  background: ${props => props.checked ? '#1976d2' : '#ccc'};
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
`

// Mock user data for 10-person chat scenario
const MOCK_USERS = [
  { id: 1, playerNickname: '사용자1', playerId: 1 },
  { id: 2, playerNickname: '게이머2', playerId: 2 },
  { id: 3, playerNickname: '플레이어3', playerId: 3 },
  { id: 4, playerNickname: '유저4', playerId: 4 },
  { id: 5, playerNickname: '참가자5', playerId: 5 },
  { id: 6, playerNickname: '멤버6', playerId: 6 },
  { id: 7, playerNickname: '프로게이머7', playerId: 7 },
  { id: 8, playerNickname: '마스터8', playerId: 8 },
  { id: 9, playerNickname: '챔피언9', playerId: 9 },
  { id: 10, playerNickname: '레전드10', playerId: 10 }
]

// Sample messages for realistic chat simulation
const SAMPLE_MESSAGES = [
  '안녕하세요! 게임 시작할까요?',
  '준비 완료했습니다! 😊',
  '이번 라운드 어떻게 생각하시나요?',
  '힌트가 너무 어려워요 🤔',
  '아직 생각 중이에요...',
  '시간이 부족할 것 같아요 ⏰',
  '좋은 전략이네요! 👍',
  '다음엔 더 잘할게요',
  '정말 재밌는 게임이에요!',
  '모두 고생하셨습니다! 🎉',
  '이 라이어 맞나요?',
  '투표할 시간입니다',
  '확신이 안 서네요 😅',
  '다들 어떻게 생각하세요?',
  '마지막 기회입니다!',
  '정답이 뭔지 궁금해요',
  '잘 모르겠어요 🤷‍♀️',
  '시간 연장 가능한가요?',
  '열심히 생각해보겠습니다',
  '모두 화이팅! 💪'
]

// System message types for testing
const SYSTEM_MESSAGES = [
  { content: '게임이 시작되었습니다!', type: 'game_event' },
  { content: '라운드 1이 시작되었습니다.', type: 'info' },
  { content: '투표 시간이 종료되었습니다.', type: 'warning' },
  { content: '사용자1님이 입장했습니다.', type: 'system' },
  { content: '게임이 성공적으로 완료되었습니다!', type: 'success' }
]

const ChatPerformanceTest = () => {
  const [messages, setMessages] = useState([])
  const [currentUser] = useState(MOCK_USERS[0]) // First user as current user
  const [isAutoSimulation, setIsAutoSimulation] = useState(false)
  const [messageSpeed, setMessageSpeed] = useState(1000) // ms
  const [batchSize, setBatchSize] = useState(1)
  const [totalMessagesSent, setTotalMessagesSent] = useState(0)
  const intervalRef = useRef(null)
  const messageIdCounter = useRef(1)

  // Generate random message
  const generateRandomMessage = () => {
    const randomUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)]
    const randomContent = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)]
    
    return {
      id: messageIdCounter.current++,
      content: randomContent,
      playerNickname: randomUser.playerNickname,
      playerId: randomUser.playerId,
      timestamp: new Date().toISOString(),
      type: 'user'
    }
  }

  // Generate system message
  const generateSystemMessage = () => {
    const randomSystem = SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]
    
    return {
      id: messageIdCounter.current++,
      content: randomSystem.content,
      timestamp: new Date().toISOString(),
      type: randomSystem.type,
      isSystem: true
    }
  }

  // Add single message
  const addSingleMessage = () => {
    const newMessage = Math.random() > 0.8 ? generateSystemMessage() : generateRandomMessage()
    setMessages(prev => [...prev, newMessage])
    setTotalMessagesSent(prev => prev + 1)
  }

  // Add batch of messages
  const addMessageBatch = (count = batchSize) => {
    const newMessages = []
    for (let i = 0; i < count; i++) {
      const message = Math.random() > 0.9 ? generateSystemMessage() : generateRandomMessage()
      newMessages.push(message)
    }
    setMessages(prev => [...prev, ...newMessages])
    setTotalMessagesSent(prev => prev + count)
  }

  // Simulate 10-person rapid chat
  const simulate10PersonChat = () => {
    // Send 50 messages rapidly to simulate active 10-person chat
    const rapidMessages = []
    for (let i = 0; i < 50; i++) {
      const message = Math.random() > 0.85 ? generateSystemMessage() : generateRandomMessage()
      rapidMessages.push(message)
    }
    setMessages(prev => [...prev, ...rapidMessages])
    setTotalMessagesSent(prev => prev + 50)
  }

  // Clear all messages
  const clearMessages = () => {
    setMessages([])
    setTotalMessagesSent(0)
  }

  // Handle manual message send
  const handleSendMessage = (content) => {
    const newMessage = {
      id: messageIdCounter.current++,
      content,
      playerNickname: currentUser.playerNickname,
      playerId: currentUser.playerId,
      timestamp: new Date().toISOString(),
      type: 'user'
    }
    setMessages(prev => [...prev, newMessage])
    setTotalMessagesSent(prev => prev + 1)
  }

  // Auto simulation effect
  useEffect(() => {
    if (isAutoSimulation) {
      intervalRef.current = setInterval(() => {
        addMessageBatch()
      }, messageSpeed)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoSimulation, messageSpeed, batchSize])

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        채팅 성능 테스트 - 10명 동시 채팅 시뮬레이션
      </Typography>
      
      {/* Performance Stats */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="h6">
              총 메시지: <Chip label={totalMessagesSent} color="primary" />
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6">
              현재 렌더링: <Chip label={messages.length} color="secondary" />
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6">
              활성 사용자: <Chip label="10명" color="success" />
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h6">
              메모리 사용량: <Chip label={`${Math.round(messages.length * 0.2)}KB`} color="info" />
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Control Panel */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={isAutoSimulation}
                  onChange={(e) => setIsAutoSimulation(e.target.checked)}
                />
              }
              label="자동 시뮬레이션"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography gutterBottom>메시지 속도 (ms)</Typography>
            <Slider
              value={messageSpeed}
              onChange={(e, newValue) => setMessageSpeed(newValue)}
              min={100}
              max={3000}
              step={100}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              label="배치 크기"
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 1))}
              size="small"
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={addSingleMessage} size="small">
                단일 메시지
              </Button>
              <Button variant="contained" onClick={() => addMessageBatch()} size="small">
                배치 추가
              </Button>
              <Button variant="outlined" onClick={simulate10PersonChat} size="small">
                10명 채팅 시뮬레이션
              </Button>
              <Button variant="outlined" color="error" onClick={clearMessages} size="small">
                초기화
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Chat Performance Display */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            최적화된 채팅 시스템 - 가상화 활성화
          </Typography>
          <Typography variant="caption" color="text.secondary">
            10명의 사용자가 동시에 채팅하는 상황을 시뮬레이션합니다. 
            메시지 높이 42px, 사용자별 색상 구분, 가상 스크롤링 적용됨.
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <OptimizedEnhancedChatSystem
            messages={messages}
            currentUser={currentUser}
            onSendMessage={handleSendMessage}
            disabled={false}
            placeholder="테스트 메시지를 입력하세요..."
            maxLength={200}
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default ChatPerformanceTest