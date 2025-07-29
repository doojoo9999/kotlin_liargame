<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '../stores/userStore'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const subjects = ref([])
const selectedSubject = ref('')
const word = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

if (!userStore.isAuthenticated) {
  router.push('/')
}

onMounted(async () => {
  await fetchSubjects()
})

const fetchSubjects = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/v1/subjects/listsubj', {
      headers: {
        'Authorization': `Bearer ${userStore.token}`
      }
    })
    subjects.value = response.data
    loading.value = false
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
    errorMessage.value = error.response?.data?.message || '주제 목록을 불러오는데 실패했습니다'
    loading.value = false
  }
}

const registerWord = async () => {
  if (!selectedSubject.value) {
    errorMessage.value = '주제를 선택해주세요'
    return
  }

  if (!word.value.trim()) {
    errorMessage.value = '단어를 입력해주세요'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    await axios.post('/api/v1/words/applyw', 
      { 
        subject: selectedSubject.value,
        word: word.value 
      },
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    successMessage.value = '단어가 성공적으로 등록되었습니다'
    word.value = '' // Clear the word input field
    loading.value = false
  } catch (error) {
    console.error('Failed to register word:', error)
    errorMessage.value = error.response?.data?.message || '단어 등록에 실패했습니다'
    loading.value = false
  }
}

const goBack = () => {
  router.push('/lobby')
}
</script>

<template>
  <div class="register-word">
    <h1>답안 등록하기</h1>
    
    <div class="form-container">
      <div v-if="loading && subjects.length === 0" class="loading">
        주제 목록을 불러오는 중...
      </div>
      
      <div v-else-if="subjects.length === 0" class="error-container">
        <p>등록된 주제가 없습니다. 먼저 주제를 등록해주세요.</p>
        <button class="btn secondary" @click="router.push('/register-subject')">주제 등록하기</button>
      </div>
      
      <template v-else>
        <div class="form-group">
          <label for="subject">주제:</label>
          <select 
            id="subject" 
            v-model="selectedSubject" 
            :disabled="loading"
          >
            <option disabled value="">주제를 선택하세요</option>
            <option 
              v-for="subject in subjects" 
              :key="subject.content" 
              :value="subject.content"
            >
              {{ subject.content }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="word">단어:</label>
          <input 
            id="word" 
            v-model="word" 
            :disabled="loading"
            placeholder="등록할 단어를 입력하세요"
            type="text"
          />
        </div>
        
        <div class="actions">
          <button 
            :disabled="loading"
            class="btn primary"
            @click="registerWord"
          >
            {{ loading ? '처리 중...' : '등록하기' }}
          </button>
          <button class="btn secondary" @click="goBack">돌아가기</button>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.register-word {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.form-container {
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

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.actions {
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

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
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
</style>