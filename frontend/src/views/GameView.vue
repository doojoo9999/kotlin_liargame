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
    case PHASE.HINT: return '?ŒíŠ¸ ?¨ê³„'
    case PHASE.DISCUSSION: return '? ë¡  ?¨ê³„'
    case PHASE.VOTING: return '?¬í‘œ ?¨ê³„'
    case PHASE.DEFENSE: return 'ë³€ë¡??¨ê³„'
    case PHASE.SURVIVAL_VOTING: return '?ì¡´ ?¬í‘œ ?¨ê³„'
    case PHASE.GUESS_WORD: return '?¨ì–´ ë§ì¶”ê¸??¨ê³„'
    case PHASE.ROUND_END: return '?¼ìš´??ì¢…ë£Œ'
    case PHASE.GAME_END: return 'ê²Œì„ ì¢…ë£Œ'
    default: return 'ê²Œì„ ì§„í–‰ ì¤?
  }
})

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}


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
    errorMessage.value = error.message || '?ŒíŠ¸ ?„ì†¡???¤íŒ¨?ˆìŠµ?ˆë‹¤'
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
    errorMessage.value = error.message || 'ë©”ì‹œì§€ ?„ì†¡???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const handlePlayerSelected = (playerId) => {
  selectedPlayerId.value = playerId
}

const votePlayer = async () => {
  if (!selectedPlayerId.value) {
    errorMessage.value = '?¬í‘œ???Œë ˆ?´ì–´ë¥?? íƒ?´ì£¼?¸ìš”'
    return
  }
  
  try {
    await gameStore.votePlayer(gameNumber, selectedPlayerId.value)
    selectedPlayerId.value = null
  } catch (error) {
    errorMessage.value = error.message || '?¬í‘œ???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const submitDefense = async () => {
  if (!defense.value.trim()) {
    errorMessage.value = 'ë³€ë¡??´ìš©???…ë ¥?´ì£¼?¸ìš”'
    return
  }
  
  try {
    await gameStore.defend(gameNumber, defense.value.trim())
    defense.value = ''
  } catch (error) {
    errorMessage.value = error.message || 'ë³€ë¡??œì¶œ???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const submitSurvivalVote = async () => {
  if (!selectedPlayerId.value) {
    errorMessage.value = '?¬í‘œ???Œë ˆ?´ì–´ë¥?? íƒ?´ì£¼?¸ìš”'
    return
  }
  
  try {
    await gameStore.survivalVote(gameNumber, selectedPlayerId.value)
    selectedPlayerId.value = null
  } catch (error) {
    errorMessage.value = error.message || '?ì¡´ ?¬í‘œ???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const submitGuessWord = async () => {
  if (!guessWord.value.trim()) {
    errorMessage.value = '?¨ì–´ë¥??…ë ¥?´ì£¼?¸ìš”'
    return
  }
  
  try {
    await gameStore.guessWord(gameNumber, guessWord.value.trim())
    guessWord.value = ''
  } catch (error) {
    errorMessage.value = error.message || '?¨ì–´ ë§ì¶”ê¸°ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const endRound = async () => {
  try {
    await gameStore.endRound(gameNumber)
  } catch (error) {
    errorMessage.value = error.message || '?¼ìš´??ì¢…ë£Œ???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}

const leaveGame = async () => {
  try {
    
    await gameStore.leaveGame(gameNumber)
    
    
    chatStore.disconnectSocket()
    
    
    router.push({ path: '/lobby', query: { _: Date.now() } })
  } catch (error) {
    console.error('Failed to leave game:', error)
    
    
    gameStore.resetGameState()
    chatStore.disconnectSocket()
    router.push({ path: '/lobby', query: { _: Date.now() } })
  }
}


onMounted(async () => {
  try {
    
    await gameStore.getGameState(gameNumber)
    
    
    chatStore.initSocket(gameNumber)
    
    
    await chatStore.getChatHistory(gameNumber)
    
    
    updateGamePhase()
    
    
    startTimer()
    
    
    refreshInterval.value = setInterval(async () => {
      try {
        await gameStore.getGameState(gameNumber)
        updateGamePhase()
        startTimer()
      } catch (error) {
        console.error('Failed to refresh game state:', error)
      }
    }, 3000) 
    
    loading.value = false
  } catch (error) {
    errorMessage.value = error.message || 'ê²Œì„ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})


watch(() => gameStore.gameState, () => {
  updateGamePhase()
  startTimer()
}, { deep: true })
</script>

<template>
  <div class="game">
    <h1>?¼ì´??ê²Œì„</h1>
    <h2>ê²Œì„ ë²ˆí˜¸: {{ gameNumber }} | ?¼ìš´?? {{ gameStore.currentRound }}/{{ gameStore.gameState?.roundCount }}</h2>
    
    <div v-if="loading" class="loading">
      ë¡œë”© ì¤?..
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="leaveGame">
        ?ˆìœ¼ë¡??Œì•„ê°€ê¸?
      </button>
    </div>
    
    <div v-else-if="gameStore.gameState && gameStore.gameState.status !== 'STARTED'" class="not-started">
      <h3>ê²Œì„???„ì§ ?œì‘?˜ì? ?Šì•˜?µë‹ˆ??/h3>
      <p>ê²Œì„ ë¡œë¹„ë¡??Œì•„ê°€??ê²Œì„???œì‘?´ì£¼?¸ìš”.</p>
      <button class="btn primary" @click="router.push(`/lobby/${gameNumber}`)">
        ë¡œë¹„ë¡??Œì•„ê°€ê¸?
      </button>
    </div>
    
    <div v-else class="game-content">
      
      <div class="phaser-game-section">
        <PhaserGameNew
          :currentPhase="phaseText"
          :currentPlayerId="userStore.userId"
          :currentRound="gameStore.currentRound"
          :gameState="gameStore.gameState"
          :isLiar="isLiar"
          :messages="chatStore.inGameMessages"
          :players="gameStore.players"
          :subject="gameStore.subject"
          :timeRemaining="timer"
          :word="gameStore.word"
          @playerSelected="handlePlayerSelected"
          @sendMessage="sendChatMessage"
        />
      </div>
      
      
      <div class="action-section">
        
        <div v-if="currentPhase === PHASE.VOTING && canVote" class="action-panel">
          <h3>?¼ì´???¬í‘œ</h3>
          <p>?¼ì´?´ë¼ê³??ê°?˜ëŠ” ?Œë ˆ?´ì–´ë¥?? íƒ?˜ì„¸??</p>
          <button 
            :disabled="!selectedPlayerId"
            class="btn primary"
            @click="votePlayer"
          >
            ?¬í‘œ?˜ê¸°
          </button>
        </div>
        
        
        <div v-if="currentPhase === PHASE.DEFENSE && canDefend" class="action-panel">
          <h3>ë³€ë¡?/h3>
          <p>?¹ì‹ ???¼ì´?´ê? ?„ë‹˜??ë³€ë¡ í•˜?¸ìš”.</p>
          <textarea 
            v-model="defense" 
            placeholder="ë³€ë¡??´ìš© ?…ë ¥..."
            rows="3"
          ></textarea>
          <button 
            :disabled="!defense.trim()"
            class="btn primary"
            @click="submitDefense"
          >
            ë³€ë¡??œì¶œ
          </button>
        </div>
        
        
        <div v-if="currentPhase === PHASE.SURVIVAL_VOTING && canSurvivalVote" class="action-panel">
          <h3>?ì¡´ ?¬í‘œ</h3>
          <p>?„ê? ?¼ì´?´ì¸ì§€ ?¤ì‹œ ?¬í‘œ?˜ì„¸??</p>
          <button 
            :disabled="!selectedPlayerId"
            class="btn primary"
            @click="submitSurvivalVote"
          >
            ?¬í‘œ?˜ê¸°
          </button>
        </div>
        
        
        <div v-if="currentPhase === PHASE.GUESS_WORD && canGuessWord" class="action-panel">
          <h3>?¨ì–´ ë§ì¶”ê¸?/h3>
          <p>?¤ë¥¸ ?Œë ˆ?´ì–´?¤ì˜ ?ŒíŠ¸ë¥?ë°”íƒ•?¼ë¡œ ?¨ì–´ë¥?ë§ì¶°ë³´ì„¸??</p>
          <input 
            v-model="guessWord" 
            placeholder="?¨ì–´ ?…ë ¥..."
            type="text"
          >
          <button 
            :disabled="!guessWord.trim()"
            class="btn primary"
            @click="submitGuessWord"
          >
            ?œì¶œ?˜ê¸°
          </button>
        </div>
        
        
        <div v-if="currentPhase === PHASE.ROUND_END" class="action-panel">
          <h3>?¼ìš´??ì¢…ë£Œ</h3>
          <div v-if="gameStore.gameResult" class="round-result">
            <p><strong>?¼ì´??</strong> {{ gameStore.gameResult.liarName }}</p>
            <p><strong>?¨ì–´:</strong> {{ gameStore.gameResult.word }}</p>
            <p><strong>ê²°ê³¼:</strong> {{ gameStore.gameResult.liarWin ? '?¼ì´???¹ë¦¬!' : '?œë? ?¹ë¦¬!' }}</p>
          </div>
          <button 
            class="btn primary"
            @click="endRound"
          >
            ?¤ìŒ ?¼ìš´??
          </button>
        </div>
        
        
        <div v-if="currentPhase === PHASE.GAME_END" class="action-panel">
          <h3>ê²Œì„ ì¢…ë£Œ</h3>
          <div v-if="gameStore.gameResult" class="game-result">
            <h4>ìµœì¢… ê²°ê³¼</h4>
            <p><strong>?¼ì´??</strong> {{ gameStore.gameResult.liarName }}</p>
            <p><strong>?¨ì–´:</strong> {{ gameStore.gameResult.word }}</p>
            <p><strong>ìµœì¢… ?¹ì:</strong> {{ gameStore.gameResult.liarWin ? '?¼ì´???¹ë¦¬!' : '?œë? ?¹ë¦¬!' }}</p>
          </div>
          <button 
            class="btn primary"
            @click="leaveGame"
          >
            ê²Œì„ ?˜ê?ê¸?
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
