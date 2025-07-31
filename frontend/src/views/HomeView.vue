<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '../stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref('')
const gameNumber = ref('')
const gamePassword = ref('')
const showLoginForm = ref(true)
const showJoinForm = ref(false)
const errorMessage = ref('')

onMounted(() => {
  
  if (userStore.checkAuth()) {
    showLoginForm.value = false
  }
})

const login = async () => {
  if (!nickname.value.trim()) {
    errorMessage.value = '사용자 이름을 입력해주세요'
    return
  }
  
  try {
    await userStore.login(nickname.value.trim())
    router.push('/lobby')
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message || '로그인에 실패했습니다'
  }
}

const logout = () => {
  userStore.logout()
  showLoginForm.value = true
  showJoinForm.value = false
}

const goToCreateGame = () => {
  router.push('/create')
}

const toggleJoinForm = () => {
  showJoinForm.value = !showJoinForm.value
  if (showJoinForm.value) {
    gameNumber.value = ''
    gamePassword.value = ''
  }
}

const joinGame = () => {
  if (!gameNumber.value.trim()) {
    errorMessage.value = '게임 번호를 입력해주세요'
    return
  }
  
  router.push({
    name: 'game-lobby',
    params: { gameNumber: gameNumber.value.trim() },
    query: gamePassword.value ? { password: gamePassword.value } : {}
  })
}
</script>

<template>
  <div class="home">
    <h1>who is liar</h1>
    
    <div v-if="showLoginForm" class="login-form">
      <h2>로그인</h2>
      <p>게임에 참여하려면 사용자 이름을 입력하세요</p>
      
      <div class="form-group">
        <label for="nickname">사용자 이름:</label>
        <input 
          id="nickname" 
          v-model="nickname" 
          placeholder="사용자 이름 입력"
          type="text"
          @keyup.enter="login"
        >
      </div>
      
      <button class="btn primary" @click="login">로그인</button>
      
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
    
    <div v-else class="game-options">
      <h2>안녕하세요, {{ userStore.nickname }}님!</h2>
      
      <div class="buttons">
        <button class="btn primary" @click="goToCreateGame">새 게임 만들기</button>
        <button class="btn secondary" @click="toggleJoinForm">
          {{ showJoinForm ? '취소' : '게임 참여하기' }}
        </button>
        <button class="btn danger" @click="logout">로그아웃</button>
      </div>
      
      <div v-if="showJoinForm" class="join-form">
        <h3>게임 참여</h3>
        
        <div class="form-group">
          <label for="gameNumber">게임 번호:</label>
          <input 
            id="gameNumber" 
            v-model="gameNumber" 
            placeholder="게임 번호 입력"
            type="number"
          >
        </div>
        
        <div class="form-group">
          <label for="gamePassword">비밀번호 (선택사항):</label>
          <input 
            id="gamePassword" 
            v-model="gamePassword" 
            placeholder="비밀번호 입력"
            type="password"
          >
        </div>
        
        <button class="btn primary" @click="joinGame">참여하기</button>
        
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.login-form, .game-options {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary {
  background-color: #4caf50;
  color: white;
}

.primary:hover {
  background-color: #45a049;
}

.secondary {
  background-color: #2196f3;
  color: white;
}

.secondary:hover {
  background-color: #0b7dda;
}

.danger {
  background-color: #f44336;
  color: white;
}

.danger:hover {
  background-color: #d32f2f;
}

.join-form {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
}

.error {
  color: #f44336;
  margin-top: 1rem;
}
</style>
