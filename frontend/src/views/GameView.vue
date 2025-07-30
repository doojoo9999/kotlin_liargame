<script setup>

import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useUserStore} from '../stores/userStore'
import {useChatStore} from '../stores/chatStore'
import PhaserGameNew from '../components/PhaserGameNew.vue'

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

if (!userStore.isAuthenticated) {
  router.push('/')
}

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

const sendChatMessage = async (message) => {
  const messageToSend = message || chatMessage.value.trim()
  if (!messageToSend) return
  
  try {
    let messageType = 'DISCUSSION'
    if (currentPhase.value === PHASE.HINT) {
      messageType = 'HINT'
    } else if (currentPhase.value === PHASE.DEFENSE) {
      messageType = 'DEFENSE'
    } else if (currentPhase.value === PHASE.ROUND_END) {
      messageType = 'POST_ROUND'
    }
    
    await chatStore.sendMessage(gameNumber, messageToSend, messageType)
    chatMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || '메시지 전송에 실패했습니다'
  }
}

const handlePlayerSelected = (playerId) => {
  selectedPlayerId.value = playerId
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
    
    <div v-else-if="gameStore.gameState && gameStore.gameState.status !== 'STARTED'" class="not-started">
      <h3>게임이 아직 시작되지 않았습니다</h3>
      <p>게임 로비로 돌아가서 게임을 시작해주세요.</p>
      <button class="btn primary" @click="router.push(`/lobby/${gameNumber}`)">
        로비로 돌아가기
      </button>
    </div>
    
    <div v-else class="game-content">
      <!-- Phaser Game Component -->
      <div class="phaser-game-section">
        <PhaserGameNew
          :currentPhase="phaseText"
          :currentPlayerId="userStore.userId"
          :currentRound="gameStore.currentRound"
          :gameState="gameStore.gameState"
          :isLiar="isLiar"
          :messages="chatStore.messages"
          :players="gameStore.players"
          :subject="gameStore.subject"
          :timeRemaining="timer"
          :word="gameStore.word"
          @playerSelected="handlePlayerSelected"
          @sendMessage="sendChatMessage"
        />
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
  max-width: 1200px;
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.phaser-game-section {
  width: 100%;
}

.action-section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

@media (max-width: 1200px) {
  .game {
    padding: 1rem;
  }
}
</style>