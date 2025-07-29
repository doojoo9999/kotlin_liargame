<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useUserStore} from '../stores/userStore'
import {useChatStore} from '../stores/chatStore'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()
const chatStore = useChatStore()

const gameNumber = parseInt(route.params.gameNumber)
const errorMessage = ref('')
const loading = ref(true)
const refreshInterval = ref(null)
const chatMessage = ref('')
const selectedPlayerId = ref(null)
const guessWord = ref('')
const defense = ref('')
const timer = ref(0)
const timerInterval = ref(null)

// Game phases
const PHASE = {
  HINT: 'HINT',
  DISCUSSION: 'DISCUSSION',
  VOTING: 'VOTING',
  DEFENSE: 'DEFENSE',
  SURVIVAL_VOTING: 'SURVIVAL_VOTING',
  GUESS_WORD: 'GUESS_WORD',
  ROUND_END: 'ROUND_END',
  GAME_END: 'GAME_END'
}

const currentPhase = ref(PHASE.HINT)

// Check if user is logged in
if (!userStore.isAuthenticated) {
  router.push('/')
}

// Computed properties
const currentPlayer = computed(() => {
  if (!gameStore.players || gameStore.players.length === 0) return null
  return gameStore.players.find(player => player.userId === userStore.userId)
})

const isLiar = computed(() => {
  return gameStore.isLiar
})

const canVote = computed(() => {
  return currentPhase.value === PHASE.VOTING && !currentPlayer.value?.hasVoted
})

const canDefend = computed(() => {
  return currentPhase.value === PHASE.DEFENSE && 
         currentPlayer.value?.userId === gameStore.gameState?.accusedPlayerId
})

const canSurvivalVote = computed(() => {
  return currentPhase.value === PHASE.SURVIVAL_VOTING && !currentPlayer.value?.hasVoted
})

const canGuessWord = computed(() => {
  return currentPhase.value === PHASE.GUESS_WORD && isLiar.value
})

const phaseText = computed(() => {
  switch (currentPhase.value) {
    case PHASE.HINT: return '힌트 단계'
    case PHASE.DISCUSSION: return '토론 단계'
    case PHASE.VOTING: return '투표 단계'
    case PHASE.DEFENSE: return '변론 단계'
    case PHASE.SURVIVAL_VOTING: return '생존 투표 단계'
    case PHASE.GUESS_WORD: return '단어 맞추기 단계'
    case PHASE.ROUND_END: return '라운드 종료'
    case PHASE.GAME_END: return '게임 종료'
    default: return '게임 진행 중'
  }
})

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// Methods
const updateGamePhase = () => {
  if (!gameStore.gameState) return
  
  const { status, phase } = gameStore.gameState
  
  if (status === 'ENDED') {
    currentPhase.value = PHASE.GAME_END
    return
  }
  
  if (phase === 'HINT') {
    currentPhase.value = PHASE.HINT
  } else if (phase === 'DISCUSSION') {
    currentPhase.value = PHASE.DISCUSSION
  } else if (phase === 'VOTING') {
    currentPhase.value = PHASE.VOTING
  } else if (phase === 'DEFENSE') {
    currentPhase.value = PHASE.DEFENSE
  } else if (phase === 'SURVIVAL_VOTING') {
    currentPhase.value = PHASE.SURVIVAL_VOTING
  } else if (phase === 'GUESS_WORD') {
    currentPhase.value = PHASE.GUESS_WORD
  } else if (phase === 'ROUND_END') {
    currentPhase.value = PHASE.ROUND_END
  }
}

const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  if (!gameStore.gameState || !gameStore.gameState.phaseEndTime) return
  
  const endTime = new Date(gameStore.gameState.phaseEndTime).getTime()
  
  timerInterval.value = setInterval(() => {
    const now = new Date().getTime()
    const distance = endTime - now
    
    if (distance <= 0) {
      clearInterval(timerInterval.value)
      timer.value = 0
      return
    }
    
    timer.value = Math.floor(distance / 1000)
  }, 1000)
}

const sendHint = async () => {
  if (!chatMessage.value.trim()) return
  
  try {
    await gameStore.giveHint(gameNumber, chatMessage.value.trim())
    chatMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || '힌트 전송에 실패했습니다'
  }
}

const sendChatMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  try {
    let messageType = 'DISCUSSION'
    if (currentPhase.value === PHASE.HINT) {
      messageType = 'HINT'
    } else if (currentPhase.value === PHASE.DEFENSE) {
      messageType = 'DEFENSE'
    } else if (currentPhase.value === PHASE.ROUND_END) {
      messageType = 'POST_ROUND'
    }
    
    await chatStore.sendMessage(gameNumber, chatMessage.value.trim(), messageType)
    chatMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || '메시지 전송에 실패했습니다'
  }
}

const votePlayer = async () => {
  if (!selectedPlayerId.value) {
    errorMessage.value = '투표할 플레이어를 선택해주세요'
    return
  }
  
  try {
    await gameStore.votePlayer(gameNumber, selectedPlayerId.value)
    selectedPlayerId.value = null
  } catch (error) {
    errorMessage.value = error.message || '투표에 실패했습니다'
  }
}

const submitDefense = async () => {
  if (!defense.value.trim()) {
    errorMessage.value = '변론 내용을 입력해주세요'
    return
  }
  
  try {
    await gameStore.defend(gameNumber, defense.value.trim())
    defense.value = ''
  } catch (error) {
    errorMessage.value = error.message || '변론 제출에 실패했습니다'
  }
}

const submitSurvivalVote = async () => {
  if (!selectedPlayerId.value) {
    errorMessage.value = '투표할 플레이어를 선택해주세요'
    return
  }
  
  try {
    await gameStore.survivalVote(gameNumber, selectedPlayerId.value)
    selectedPlayerId.value = null
  } catch (error) {
    errorMessage.value = error.message || '생존 투표에 실패했습니다'
  }
}

const submitGuessWord = async () => {
  if (!guessWord.value.trim()) {
    errorMessage.value = '단어를 입력해주세요'
    return
  }
  
  try {
    await gameStore.guessWord(gameNumber, guessWord.value.trim())
    guessWord.value = ''
  } catch (error) {
    errorMessage.value = error.message || '단어 맞추기에 실패했습니다'
  }
}

const endRound = async () => {
  try {
    await gameStore.endRound(gameNumber)
  } catch (error) {
    errorMessage.value = error.message || '라운드 종료에 실패했습니다'
  }
}

const leaveGame = () => {
  // Clear game state
  gameStore.resetGameState()
  
  // Disconnect chat socket
  chatStore.disconnectSocket()
  
  // Navigate back to home
  router.push('/')
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Get game state
    await gameStore.getGameState(gameNumber)
    
    // Initialize chat socket
    chatStore.initSocket(gameNumber)
    
    // Get chat history
    await chatStore.getChatHistory(gameNumber)
    
    // Update game phase
    updateGamePhase()
    
    // Start timer
    startTimer()
    
    // Set up polling for game state updates
    refreshInterval.value = setInterval(async () => {
      try {
        await gameStore.getGameState(gameNumber)
        updateGamePhase()
        startTimer()
      } catch (error) {
        console.error('Failed to refresh game state:', error)
      }
    }, 3000) // Poll every 3 seconds
    
    loading.value = false
  } catch (error) {
    errorMessage.value = error.message || '게임 정보를 불러오는데 실패했습니다'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  // Clear intervals
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// Watch for changes in game state
watch(() => gameStore.gameState, () => {
  updateGamePhase()
  startTimer()
}, { deep: true })
</script>

<template>
  <div class="game">
    <h1>라이어 게임</h1>
    <h2>게임 번호: {{ gameNumber }} | 라운드: {{ gameStore.currentRound }}/{{ gameStore.gameState?.roundCount }}</h2>
    
    <div v-if="loading" class="loading">
      로딩 중...
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="leaveGame">
        홈으로 돌아가기
      </button>
    </div>
    
    <div v-else class="game-content">
      <!-- Game info section -->
      <div class="game-info">
        <div class="phase-info">
          <h3>{{ phaseText }}</h3>
          <div v-if="timer > 0" class="timer">
            남은 시간: {{ formatTime(timer) }}
          </div>
        </div>
        
        <div class="subject-info">
          <h3>주제: {{ gameStore.subject }}</h3>
          <p v-if="isLiar" class="liar-info">
            당신은 라이어입니다! 다른 플레이어들의 힌트를 듣고 단어를 추측하세요.
          </p>
          <p v-else class="word-info">
            단어: <strong>{{ gameStore.word }}</strong>
          </p>
        </div>
      </div>
      
      <!-- Players section -->
      <div class="players-section">
        <h3>플레이어</h3>
        <ul class="players-list">
          <li 
            v-for="player in gameStore.players" 
            :key="player.userId"
            :class="{
              'current-user': player.userId === userStore.userId,
              'selected': player.userId === selectedPlayerId,
              'voted': player.hasVoted,
              'accused': gameStore.gameState?.accusedPlayerId === player.userId
            }"
            @click="canVote || canSurvivalVote ? selectedPlayerId = player.userId : null"
          >
            {{ player.username }} 
            <span v-if="player.userId === userStore.userId" class="user-badge">나</span>
            <span v-if="player.hasVoted" class="voted-badge">투표 완료</span>
            <span v-if="gameStore.gameState?.accusedPlayerId === player.userId" class="accused-badge">지목됨</span>
          </li>
        </ul>
      </div>
      
      <!-- Chat section -->
      <div class="chat-section">
        <h3>채팅</h3>
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatStore.messages" 
            :key="index"
            :class="{ 'hint-message': message.type === 'HINT', 'defense-message': message.type === 'DEFENSE' }"
            class="chat-message"
          >
            <span class="message-sender">{{ message.senderName }}:</span>
            <span class="message-content">{{ message.content }}</span>
          </div>
        </div>
        
        <div class="chat-input">
          <input 
            v-model="chatMessage" 
            placeholder="메시지 입력..."
            type="text"
            @keyup.enter="currentPhase === PHASE.HINT && !isLiar ? sendHint() : sendChatMessage()"
          >
          <button 
            class="btn primary"
            @click="currentPhase === PHASE.HINT && !isLiar ? sendHint() : sendChatMessage()"
          >
            {{ currentPhase === PHASE.HINT && !isLiar ? '힌트 보내기' : '전송' }}
          </button>
        </div>
      </div>
      
      <!-- Action section -->
      <div class="action-section">
        <!-- Voting phase -->
        <div v-if="currentPhase === PHASE.VOTING && canVote" class="action-panel">
          <h3>라이어 투표</h3>
          <p>라이어라고 생각하는 플레이어를 선택하세요.</p>
          <button 
            :disabled="!selectedPlayerId"
            class="btn primary"
            @click="votePlayer"
          >
            투표하기
          </button>
        </div>
        
        <!-- Defense phase -->
        <div v-if="currentPhase === PHASE.DEFENSE && canDefend" class="action-panel">
          <h3>변론</h3>
          <p>당신이 라이어가 아님을 변론하세요.</p>
          <textarea 
            v-model="defense" 
            placeholder="변론 내용 입력..."
            rows="3"
          ></textarea>
          <button 
            :disabled="!defense.trim()"
            class="btn primary"
            @click="submitDefense"
          >
            변론 제출
          </button>
        </div>
        
        <!-- Survival voting phase -->
        <div v-if="currentPhase === PHASE.SURVIVAL_VOTING && canSurvivalVote" class="action-panel">
          <h3>생존 투표</h3>
          <p>누가 라이어인지 다시 투표하세요.</p>
          <button 
            :disabled="!selectedPlayerId"
            class="btn primary"
            @click="submitSurvivalVote"
          >
            투표하기
          </button>
        </div>
        
        <!-- Guess word phase -->
        <div v-if="currentPhase === PHASE.GUESS_WORD && canGuessWord" class="action-panel">
          <h3>단어 맞추기</h3>
          <p>다른 플레이어들의 힌트를 바탕으로 단어를 맞춰보세요.</p>
          <input 
            v-model="guessWord" 
            placeholder="단어 입력..."
            type="text"
          >
          <button 
            :disabled="!guessWord.trim()"
            class="btn primary"
            @click="submitGuessWord"
          >
            제출하기
          </button>
        </div>
        
        <!-- Round end phase -->
        <div v-if="currentPhase === PHASE.ROUND_END" class="action-panel">
          <h3>라운드 종료</h3>
          <div v-if="gameStore.gameResult" class="round-result">
            <p><strong>라이어:</strong> {{ gameStore.gameResult.liarName }}</p>
            <p><strong>단어:</strong> {{ gameStore.gameResult.word }}</p>
            <p><strong>결과:</strong> {{ gameStore.gameResult.liarWin ? '라이어 승리!' : '시민 승리!' }}</p>
          </div>
          <button 
            class="btn primary"
            @click="endRound"
          >
            다음 라운드
          </button>
        </div>
        
        <!-- Game end phase -->
        <div v-if="currentPhase === PHASE.GAME_END" class="action-panel">
          <h3>게임 종료</h3>
          <div v-if="gameStore.gameResult" class="game-result">
            <h4>최종 결과</h4>
            <p><strong>라이어:</strong> {{ gameStore.gameResult.liarName }}</p>
            <p><strong>단어:</strong> {{ gameStore.gameResult.word }}</p>
            <p><strong>최종 승자:</strong> {{ gameStore.gameResult.liarWin ? '라이어 승리!' : '시민 승리!' }}</p>
          </div>
          <button 
            class="btn primary"
            @click="leaveGame"
          >
            게임 나가기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

h1, h2 {
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #666;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  margin: 2rem 0;
}

.error-container {
  text-align: center;
  margin: 2rem 0;
}

.game-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  grid-template-rows: auto auto auto;
  gap: 1.5rem;
}

.game-info {
  grid-column: 1 / span 2;
  grid-row: 1;
  display: flex;
  justify-content: space-between;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.phase-info, .subject-info {
  flex: 1;
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: #f44336;
}

.liar-info {
  color: #f44336;
  font-weight: bold;
}

.word-info {
  font-size: 1.1rem;
}

.players-section {
  grid-column: 1;
  grid-row: 2;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-section {
  grid-column: 2;
  grid-row: 2;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.action-section {
  grid-column: 1 / span 2;
  grid-row: 3;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.players-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.players-list li {
  padding: 0.75rem;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.players-list li:last-child {
  border-bottom: none;
}

.players-list .current-user {
  font-weight: bold;
  background-color: rgba(33, 150, 243, 0.1);
}

.players-list .selected {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid #4caf50;
}

.players-list .voted {
  opacity: 0.7;
}

.players-list .accused {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
}

.user-badge, .voted-badge, .accused-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.user-badge {
  background-color: #2196f3;
  color: white;
}

.voted-badge {
  background-color: #9e9e9e;
  color: white;
}

.accused-badge {
  background-color: #f44336;
  color: white;
}

.chat-messages {
  flex: 1;
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background-color: white;
  margin-bottom: 1rem;
}

.chat-message {
  margin-bottom: 0.5rem;
}

.hint-message {
  background-color: rgba(33, 150, 243, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
}

.defense-message {
  background-color: rgba(244, 67, 54, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
}

.message-sender {
  font-weight: bold;
  margin-right: 0.5rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.chat-input input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.action-panel {
  text-align: center;
}

.action-panel textarea, 
.action-panel input[type="text"] {
  width: 100%;
  max-width: 400px;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.round-result, .game-result {
  margin: 1rem 0;
  padding: 1rem;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.primary {
  background-color: #4caf50;
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #45a049;
}

.secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ccc;
}

.secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.error {
  color: #f44336;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .game-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
  }
  
  .game-info {
    grid-column: 1;
    grid-row: 1;
    flex-direction: column;
  }
  
  .players-section {
    grid-column: 1;
    grid-row: 2;
  }
  
  .chat-section {
    grid-column: 1;
    grid-row: 3;
  }
  
  .action-section {
    grid-column: 1;
    grid-row: 4;
  }
}
</style>