<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useUserStore} from '../stores/userStore'
import {useChatStore} from '../stores/chatStore'
import PhaserGame from '../components/PhaserGame.vue'

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

const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${hours}:${minutes}`
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

const leaveGame = async () => {
  try {
    // Call the leaveGame action in gameStore
    await gameStore.leaveGame(gameNumber)
    
    // Disconnect chat socket
    chatStore.disconnectSocket()
    
    // Navigate back to main lobby and force a refresh
    router.push({ path: '/lobby', query: { _: Date.now() } })
  } catch (error) {
    console.error('Failed to leave game:', error)
    
    // Even if the API call fails, we should still reset the state and redirect
    gameStore.resetGameState()
    chatStore.disconnectSocket()
    router.push({ path: '/lobby', query: { _: Date.now() } })
  }
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

// Watch for changes in chat messages to auto-scroll
const chatMessagesContainer = ref(null)
watch(() => chatStore.messages, () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<template>
  <div class="game">
    <h1>라이어 게임</h1>
    <h2>게임 번호: {{ gameNumber }} | 라운드: {{ gameStore.currentRound }}/{{ gameStore.gameState?.roundCount }}</h2>
    
    <div v-if="gameStore.gameState" class="game-summary">
      <div class="summary-item">
        <span class="label">상태:</span>
        <span class="value">{{ gameStore.gameState.status === 'STARTED' ? '시작됨' : '대기 중' }}</span>
      </div>
      <div class="summary-item">
        <span class="label">최대 인원:</span>
        <span class="value">{{ gameStore.gameState.playerCount }}명</span>
      </div>
      <div class="summary-item">
        <span class="label">제한 시간:</span>
        <span class="value">{{ gameStore.gameState.timeLimit }}초</span>
      </div>
      <div class="summary-item">
        <span class="label">라운드 수:</span>
        <span class="value">{{ gameStore.gameState.roundCount }}</span>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      로딩 중...
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="leaveGame">
        홈으로 돌아가기
      </button>
    </div>
    
    <div v-else-if="gameStore.gameState && gameStore.gameState.status !== 'STARTED'" class="not-started">
      <h3>게임이 아직 시작되지 않았습니다</h3>
      <p>게임 로비로 돌아가서 게임을 시작해주세요.</p>
      <button class="btn primary" @click="router.push(`/lobby/${gameNumber}`)">
        로비로 돌아가기
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
          
          <!-- Liar information -->
          <div v-if="isLiar" class="liar-info">
            <p class="liar-badge">당신은 라이어입니다!</p>
            
            <div v-if="gameStore.gameMode === 'LIARS_DIFFERENT_WORD'" class="liar-different-word">
              <p>당신에게는 다른 주제가 주어졌습니다. 다른 플레이어들이 어떤 주제에 대해 이야기하는지 파악하세요.</p>
              <p>당신의 주제: <strong>{{ gameStore.subject }}</strong></p>
            </div>
            
            <div v-else class="liar-same-word">
              <p>다른 플레이어들의 힌트를 듣고 단어를 추측하세요.</p>
              <p>주제는 알려드리지만, 정확한 단어는 모릅니다.</p>
            </div>
          </div>
          
          <!-- Citizen information -->
          <div v-else class="word-info">
            <p>당신은 시민입니다.</p>
            <p>단어: <strong>{{ gameStore.word }}</strong></p>
            <p>라이어가 누구인지 찾아내세요!</p>
          </div>
        </div>
      </div>
      
      <!-- Phaser Game Component -->
      <div class="phaser-game-section">
        <h3>게임 시각화</h3>
        <PhaserGame
          :currentPhase="phaseText"
          :currentPlayerId="userStore.userId"
          :currentRound="gameStore.currentRound"
          :gameState="gameStore.gameState"
          :isLiar="isLiar"
          :players="gameStore.players"
          :subject="gameStore.subject"
          :word="gameStore.word"
          @playerSelected="selectedPlayerId = $event"
        />
      </div>
      
      <!-- Game instructions section -->
      <div class="game-instructions">
        <h3>게임 진행 안내</h3>
        <div class="instructions-content">
          <div class="instruction-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>힌트 단계</h4>
              <p>모든 플레이어는 주어진 단어에 대한 힌트를 제공합니다. 라이어는 단어를 모르지만 다른 플레이어의 힌트를 듣고 추측해야 합니다.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>토론 단계</h4>
              <p>모든 플레이어가 힌트를 제공한 후, 누가 라이어인지 토론합니다. 채팅을 통해 의견을 나눌 수 있습니다.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>투표 단계</h4>
              <p>토론이 끝나면 라이어라고 생각하는 플레이어에게 투표합니다.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>변론 단계</h4>
              <p>가장 많은 표를 받은 플레이어는 자신이 라이어가 아님을 변론할 기회를 갖습니다.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <h4>생존 투표 단계</h4>
              <p>변론 후 다시 투표를 진행하여 해당 플레이어의 생존 여부를 결정합니다.</p>
            </div>
          </div>
          
          <div class="instruction-step">
            <div class="step-number">6</div>
            <div class="step-content">
              <h4>단어 맞추기 단계</h4>
              <p>라이어가 지목되면 라이어는 단어를 맞출 기회를 갖습니다. 맞추면 라이어 승리, 틀리면 시민 승리입니다.</p>
            </div>
          </div>
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
            {{ player.nickname }} 
            <span v-if="player.userId === userStore.userId" class="user-badge">나</span>
            <span v-if="player.hasVoted" class="voted-badge">투표 완료</span>
            <span v-if="gameStore.gameState?.accusedPlayerId === player.userId" class="accused-badge">지목됨</span>
          </li>
        </ul>
      </div>
      
      <!-- Chat section -->
      <div class="chat-section">
        <h3>채팅</h3>
        <div ref="chatMessagesContainer" class="chat-messages">
          <div v-if="chatStore.messages.length === 0" class="no-messages">
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </div>
          <div 
            v-for="(message, index) in chatStore.messages" 
            :key="index"
            :class="{ 
              'hint-message': message.type === 'HINT', 
              'defense-message': message.type === 'DEFENSE',
              'system-message': message.type === 'SYSTEM'
            }"
            class="chat-message"
          >
            <span class="message-sender">{{ message.senderName }}:</span>
            <span class="message-content">{{ message.content }}</span>
            <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
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
  grid-template-rows: auto auto auto auto;
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
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
}

.liar-badge {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: #f44336;
  color: white;
  border-radius: 4px;
  display: inline-block;
}

.liar-different-word, .liar-same-word {
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.7);
}

.word-info {
  font-size: 1.1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid #4caf50;
  color: #2e7d32;
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

.phaser-game-section {
  grid-column: 1 / span 2;
  grid-row: 3;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-section {
  grid-column: 1 / span 2;
  grid-row: 4;
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

.message-content {
  flex: 1;
}

.message-time {
  font-size: 0.8rem;
  color: #999;
  margin-left: 0.5rem;
}

.no-messages {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-style: italic;
}

.system-message {
  background-color: rgba(158, 158, 158, 0.1);
  font-style: italic;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
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

.game-summary {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
}

.summary-item .label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.summary-item .value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
}

.not-started {
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.not-started h3 {
  margin-bottom: 1rem;
  color: #f44336;
}

.not-started p {
  margin-bottom: 1.5rem;
}

.game-instructions {
  grid-column: 1 / span 2;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.instructions-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.instruction-step {
  display: flex;
  align-items: flex-start;
  background-color: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.step-number {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2rem;
  height: 2rem;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  margin-right: 1rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .game-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto auto;
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
  
  .phaser-game-section {
    grid-column: 1;
    grid-row: 4;
  }
  
  .action-section {
    grid-column: 1;
    grid-row: 5;
  }
}
</style>