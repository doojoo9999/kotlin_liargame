<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useUserStore} from '../stores/userStore'

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

// Form data
const gameName = ref('')
const playerCount = ref(4)
const timeLimit = ref(60)
const roundCount = ref(3)
const password = ref('')
const usePassword = ref(false)
const errorMessage = ref('')
const loading = ref(false)

// Validation limits
const minPlayers = 3
const maxPlayers = 10
const minTimeLimit = 30
const maxTimeLimit = 300
const minRounds = 1
const maxRounds = 10

// Check if user is logged in
if (!userStore.isAuthenticated) {
  router.push('/')
}

const createGame = async () => {
  // Validate inputs
  if (!gameName.value.trim()) {
    errorMessage.value = '게임방 이름을 입력해주세요'
    return
  }
  
  if (playerCount.value < minPlayers || playerCount.value > maxPlayers) {
    errorMessage.value = `플레이어 수는 ${minPlayers}~${maxPlayers} 사이여야 합니다`
    return
  }
  
  if (timeLimit.value < minTimeLimit || timeLimit.value > maxTimeLimit) {
    errorMessage.value = `제한 시간은 ${minTimeLimit}~${maxTimeLimit} 사이여야 합니다`
    return
  }
  
  if (roundCount.value < minRounds || roundCount.value > maxRounds) {
    errorMessage.value = `라운드 수는 ${minRounds}~${maxRounds} 사이여야 합니다`
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const gameNumber = await gameStore.createGame(
      gameName.value.trim(),
      playerCount.value,
      timeLimit.value,
      roundCount.value,
      usePassword.value ? password.value : null
    )
    
    // Navigate to the game lobby
    router.push({
      name: 'game-lobby',
      params: { gameNumber }
    })
  } catch (error) {
    errorMessage.value = error.message || '게임 생성에 실패했습니다'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="create-game">
    <h1>새 게임 만들기</h1>
    
    <div class="game-form">
      <div class="form-group">
        <label for="gameName">게임방 이름:</label>
        <input 
          id="gameName" 
          v-model="gameName" 
          placeholder="게임방 이름 입력"
          type="text"
        >
      </div>
      
      <div class="form-group">
        <label for="playerCount">플레이어 수:</label>
        <input 
          id="playerCount" 
          v-model.number="playerCount" 
          max="10"
          min="3" 
          type="number"
        >
        <span class="hint">{{ minPlayers }}~{{ maxPlayers }} 사이의 값</span>
      </div>
      
      <div class="form-group">
        <label for="timeLimit">제한 시간 (초):</label>
        <input 
          id="timeLimit" 
          v-model.number="timeLimit" 
          max="300"
          min="30" 
          step="10"
          type="number"
        >
        <span class="hint">{{ minTimeLimit }}~{{ maxTimeLimit }} 사이의 값</span>
      </div>
      
      <div class="form-group">
        <label for="roundCount">라운드 수:</label>
        <input 
          id="roundCount" 
          v-model.number="roundCount" 
          max="10"
          min="1" 
          type="number"
        >
        <span class="hint">{{ minRounds }}~{{ maxRounds }} 사이의 값</span>
      </div>
      
      <div class="form-group">
        <div class="checkbox-group">
          <input 
            id="usePassword" 
            v-model="usePassword" 
            type="checkbox"
          >
          <label for="usePassword">비밀번호 사용</label>
        </div>
      </div>
      
      <div v-if="usePassword" class="form-group">
        <label for="password">비밀번호:</label>
        <input 
          id="password" 
          v-model="password" 
          placeholder="게임 비밀번호 입력"
          type="password"
        >
      </div>
      
      <div class="buttons">
        <button 
          :disabled="loading"
          class="btn primary" 
          @click="createGame"
        >
          {{ loading ? '생성 중...' : '게임 생성' }}
        </button>
        <button :disabled="loading" class="btn secondary" @click="goBack">
          취소
        </button>
      </div>
      
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.create-game {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.game-form {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input[type="number"],
input[type="password"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group input {
  margin-right: 0.5rem;
}

.checkbox-group label {
  margin-bottom: 0;
}

.hint {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.25rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
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
  margin-top: 1rem;
}
</style>