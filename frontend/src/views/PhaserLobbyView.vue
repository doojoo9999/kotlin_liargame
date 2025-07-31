<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useUserStore} from '../stores/userStore'
import {useChatStore} from '../stores/chatStore'
import PhaserLobbyScene from '../components/PhaserLobbyScene.vue'

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

const canStartGame = computed(() => {
  return isHost.value && 
         gameStore.players.length >= 3 && 
         gameStore.gameState && 
         gameStore.gameState.gState === 'WAITING'
})

if (!userStore.isAuthenticated) {
  router.push('/')
}

onMounted(async () => {
  try {
    await gameStore.joinGame(gameNumber, password)
    
    chatStore.initSocket(gameNumber)
    
    await chatStore.getChatHistory(gameNumber, 'LOBBY')

    isHost.value = gameStore.gameState && 
                  gameStore.gameState.owner === userStore.nickname
    
    refreshInterval.value = setInterval(async () => {
      try {
        await gameStore.getGameState(gameNumber)
        
        if (gameStore.gameState && gameStore.gameState.gState === 'IN_PROGRESS') {
          router.push({
            name: 'game',
            params: { gameNumber }
          })
        }
        
        
        if (gameStore.gameState && gameStore.gameState.players) {
          gameStore.players = [...gameStore.gameState.players]
          console.log('Updated players list:', gameStore.players)
        }
      } catch (error) {
        console.error('Failed to refresh game state:', error)
      }
    }, 3000)
    
    loading.value = false
  } catch (error) {
    errorMessage.value = error.message || 'ê²Œìž„ ì°¸ì—¬???¤íŒ¨?ˆìŠµ?ˆë‹¤'
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

const startGame = async () => {
  if (!isHost.value) {
    errorMessage.value = 'ê²Œìž„ ?œìž‘?€ ë°©ìž¥ë§??????ˆìŠµ?ˆë‹¤'
    return
  }
  
  if (!canStartGame.value) {
    errorMessage.value = 'ê²Œìž„ ?œìž‘ ?”ê±´??ì¶©ì¡±?˜ì? ?Šì•˜?µë‹ˆ??
    return
  }
  
  try {
    loading.value = true
    await gameStore.startGame(gameNumber)
    
  } catch (error) {
    errorMessage.value = error.message || 'ê²Œìž„ ?œìž‘???¤íŒ¨?ˆìŠµ?ˆë‹¤'
    loading.value = false
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

const sendChatMessage = async (message) => {
  try {
    await chatStore.sendMessage(gameNumber, message, 'LOBBY')
  } catch (error) {
    console.error('Failed to send message:', error)
    errorMessage.value = error.message || 'ë©”ì‹œì§€ ?„ì†¡???¤íŒ¨?ˆìŠµ?ˆë‹¤'
  }
}
</script>

<template>
  <div class="phaser-lobby">
    <div v-if="loading" class="loading">
      ë¡œë”© ì¤?..
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="leaveGame">
        ?ˆìœ¼ë¡??Œì•„ê°€ê¸?
      </button>
    </div>
    
    <div v-else class="lobby-content">
      
      <div class="phaser-lobby-section">
        <PhaserLobbyScene
          :canStartGame="canStartGame"
          :currentPlayerId="userStore.userId"
          :gameNumber="gameNumber"
          :gameState="gameStore.gameState"
          :isHost="isHost"
          :messages="chatStore.lobbyMessages"
          :players="gameStore.players"
          @leaveGame="leaveGame"
          @sendMessage="sendChatMessage"
          @startGame="startGame"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.phaser-lobby {
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.phaser-lobby-section {
  width: 100%;
}

.error {
  color: #f44336;
  margin-bottom: 1rem;
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

@media (max-width: 1200px) {
  .phaser-lobby {
    padding: 1rem;
  }
}
</style>
