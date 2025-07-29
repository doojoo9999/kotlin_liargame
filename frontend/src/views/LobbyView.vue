<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
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
const password = route.query.password
const errorMessage = ref('')
const loading = ref(true)
const refreshInterval = ref(null)
const isHost = ref(false)

// Check if user is logged in
if (!userStore.isAuthenticated) {
  router.push('/')
}

onMounted(async () => {
  try {
    // Join the game
    await gameStore.joinGame(gameNumber, password)
    
    // Initialize chat socket
    chatStore.initSocket(gameNumber)
    
    // Get chat history
    await chatStore.getChatHistory(gameNumber)
    
    // Check if current user is the host (first player)
    isHost.value = gameStore.players.length > 0 && 
                  gameStore.players[0].userId === userStore.userId
    
    // Set up polling for game state updates
    refreshInterval.value = setInterval(async () => {
      try {
        await gameStore.getGameState(gameNumber)
        
        // If game has started, navigate to game view
        if (gameStore.gameState && gameStore.gameState.status === 'STARTED') {
          router.push({
            name: 'game',
            params: { gameNumber }
          })
        }
      } catch (error) {
        console.error('Failed to refresh game state:', error)
      }
    }, 3000) // Poll every 3 seconds
    
    loading.value = false
  } catch (error) {
    errorMessage.value = error.message || '게임 참여에 실패했습니다'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  // Clear polling interval
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const startGame = async () => {
  if (!isHost.value) {
    errorMessage.value = '게임 시작은 방장만 할 수 있습니다'
    return
  }
  
  try {
    loading.value = true
    await gameStore.startGame(gameNumber)
    
    // Navigation to game view will happen automatically via the polling
  } catch (error) {
    errorMessage.value = error.message || '게임 시작에 실패했습니다'
    loading.value = false
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
</script>

<template>
  <div class="lobby">
    <h1>게임 로비</h1>
    <h2>게임 번호: {{ gameNumber }}</h2>
    
    <div v-if="loading" class="loading">
      로딩 중...
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="leaveGame">
        홈으로 돌아가기
      </button>
    </div>
    
    <div v-else class="lobby-content">
      <div class="players-section">
        <h3>참가자 ({{ gameStore.players.length }}명)</h3>
        <ul class="players-list">
          <li 
            v-for="player in gameStore.players" 
            :key="player.userId"
            :class="{ 'current-user': player.userId === userStore.userId, 'host': player.isHost }"
          >
            {{ player.username }} 
            <span v-if="player.isHost" class="host-badge">방장</span>
            <span v-if="player.userId === userStore.userId" class="user-badge">나</span>
          </li>
        </ul>
      </div>
      
      <div class="game-info">
        <h3>게임 정보</h3>
        <p v-if="gameStore.gameState">
          <strong>상태:</strong> {{ gameStore.gameState.status === 'WAITING' ? '대기 중' : '시작됨' }}<br>
          <strong>최대 인원:</strong> {{ gameStore.gameState.playerCount }}명<br>
          <strong>제한 시간:</strong> {{ gameStore.gameState.timeLimit }}초<br>
          <strong>라운드 수:</strong> {{ gameStore.gameState.roundCount }}
        </p>
      </div>
      
      <div class="chat-section">
        <h3>채팅</h3>
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatStore.messages" 
            :key="index"
            class="chat-message"
          >
            <span class="message-sender">{{ message.senderName }}:</span>
            <span class="message-content">{{ message.content }}</span>
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button 
          v-if="isHost" 
          :disabled="gameStore.players.length < 3"
          class="btn primary"
          @click="startGame"
        >
          게임 시작
        </button>
        <button class="btn secondary" @click="leaveGame">
          나가기
        </button>
      </div>
      
      <p v-if="isHost && gameStore.players.length < 3" class="hint">
        게임을 시작하려면 최소 3명의 플레이어가 필요합니다.
      </p>
    </div>
  </div>
</template>

<style scoped>
.lobby {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
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
  margin-bottom: 2rem;
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

.lobby-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 1.5rem;
}

.players-section {
  grid-column: 1;
  grid-row: 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.game-info {
  grid-column: 2;
  grid-row: 1;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-section {
  grid-column: 1 / span 2;
  grid-row: 2;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.actions {
  grid-column: 1 / span 2;
  grid-row: 3;
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
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

.host-badge, .user-badge {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.host-badge {
  background-color: #ff9800;
  color: white;
}

.user-badge {
  background-color: #2196f3;
  color: white;
}

.chat-messages {
  height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  background-color: white;
}

.chat-message {
  margin-bottom: 0.5rem;
}

.message-sender {
  font-weight: bold;
  margin-right: 0.5rem;
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

.hint {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .lobby-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
  }
  
  .players-section, .game-info, .chat-section, .actions {
    grid-column: 1;
  }
  
  .players-section {
    grid-row: 1;
  }
  
  .game-info {
    grid-row: 2;
  }
  
  .chat-section {
    grid-row: 3;
  }
  
  .actions {
    grid-row: 4;
  }
}
</style>