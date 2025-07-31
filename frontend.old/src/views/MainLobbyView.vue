<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '../stores/userStore'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const gameRooms = ref([])
const loading = ref(true)
const errorMessage = ref('')
const refreshInterval = ref(null)

if (!userStore.isAuthenticated) {
  router.push('/lobby')
}

onMounted(async () => {
  await fetchGameRooms()
  
  refreshInterval.value = setInterval(async () => {
    await fetchGameRooms()
  }, 5000)
  
  window.addEventListener('refresh-game-rooms', handleRefreshEvent)
})

const handleRefreshEvent = async () => {
  console.log('Received refresh-game-rooms event, refreshing game rooms list')
  await fetchGameRooms()
}

onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  
  window.removeEventListener('refresh-game-rooms', handleRefreshEvent)
})

const fetchGameRooms = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/v1/game/rooms', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    gameRooms.value = response.data.gameRooms
    loading.value = false
  } catch (error) {
    console.error('Failed to fetch game rooms:', error)
    errorMessage.value = error.response?.data?.message || '게임방 목록을 불러오는데 실패했습니다'
    loading.value = false
  }
}

const createGame = () => {
  router.push('/create')
}

const joinGame = (gameNumber, hasPassword) => {
  if (hasPassword) {
    const password = prompt('게임방 비밀번호를 입력하세요:')
    if (password === null) return
    
    router.push({
      name: 'game-lobby',
      params: { gameNumber },
      query: { password }
    })
  } else {
    router.push({
      name: 'game-lobby',
      params: { gameNumber }
    })
  }
}

const logout = () => {
  userStore.logout()
  router.push('/')
}

const registerSubject = () => {
  router.push('/register-subject')
}

const registerWord = () => {
  router.push('/register-word')
}

const getStatusText = (status) => {
  switch (status) {
    case 'WAITING': return '대기 중'
    case 'IN_PROGRESS': return '진행 중'
    case 'ENDED': return '종료됨'
    default: return status
  }
}
</script>

<template>
  <div class="main-lobby">
    <h1>게임 로비</h1>
    
    <div class="user-info">
      <p>안녕하세요, {{ userStore.nickname }}님!</p>
      <button class="btn danger" @click="logout">로그아웃</button>
    </div>
    
    <div class="actions">
      <button class="btn primary" @click="createGame">새 게임 만들기</button>
      <button class="btn secondary" @click="fetchGameRooms">새로고침</button>
      <button class="btn topic" @click="registerSubject">주제 등록하기</button>
      <button class="btn answer" @click="registerWord">답안 등록하기</button>
    </div>
    
    <div v-if="loading" class="loading">
      로딩 중...
    </div>
    
    <div v-else-if="errorMessage" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <button class="btn secondary" @click="fetchGameRooms">다시 시도</button>
    </div>
    
    <div v-else-if="gameRooms && gameRooms.length === 0" class="empty-state">
      <p>현재 활성화된 게임방이 없습니다.</p>
      <p>새 게임을 만들어보세요!</p>
    </div>
    
    <div v-else-if="gameRooms" class="game-rooms">
      <h2>게임방 목록</h2>
      
      <table>
        <thead>
          <tr>
            <th>방 번호</th>
            <th>방 이름</th>
            <th>인원</th>
            <th>비밀번호</th>
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in gameRooms" :key="room.gameNumber">
            <td>{{ room.gameNumber }}</td>
            <td>{{ room.gameName }}</td>
            <td>{{ room.playerCount }} / {{ room.maxPlayers }}</td>
            <td>
              <span v-if="room.hasPassword" class="password-icon">🔒</span>
              <span v-else>-</span>
            </td>
            <td>{{ getStatusText(room.status) }}</td>
            <td>
              <button 
                :disabled="room.status !== 'WAITING' || room.playerCount >= room.maxPlayers"
                class="btn join"
                @click="joinGame(room.gameNumber, room.hasPassword)"
              >
                참여
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="error-container">
      <p class="error">데이터를 불러오는 중 오류가 발생했습니다.</p>
      <button class="btn secondary" @click="fetchGameRooms">다시 시도</button>
    </div>
  </div>
</template>

<style scoped>
.main-lobby {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

h2 {
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
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

.empty-state {
  text-align: center;
  margin: 3rem 0;
  color: #666;
}

.game-rooms {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f0f0f0;
  font-weight: bold;
}

tr:hover {
  background-color: #f9f9f9;
}

.password-icon {
  color: #f44336;
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
  background-color: #2196f3;
  color: white;
}

.secondary:hover:not(:disabled) {
  background-color: #0b7dda;
}

.danger {
  background-color: #f44336;
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #d32f2f;
}

.join {
  background-color: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.join:hover:not(:disabled) {
  background-color: #e68a00;
}

.topic {
  background-color: #9c27b0;
  color: white;
}

.topic:hover:not(:disabled) {
  background-color: #7b1fa2;
}

.answer {
  background-color: #ff5722;
  color: white;
}

.answer:hover:not(:disabled) {
  background-color: #e64a19;
}

@media (max-width: 768px) {
  table {
    font-size: 0.9rem;
  }
  
  th, td {
    padding: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
  }
  
  .actions {
    flex-wrap: wrap;
  }
}
</style>