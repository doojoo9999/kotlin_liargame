<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '../stores/userStore'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

const subject = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

if (!userStore.isAuthenticated) {
  router.push('/')
}

const registerSubject = async () => {
  if (!subject.value.trim()) {
    errorMessage.value = 'Ï£ºÏ†úÎ•??ÖÎ†•?¥Ï£º?∏Ïöî'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    await axios.post('/api/v1/subjects/applysubj', 
      { content: subject.value },
      {
        headers: {
          'Authorization': `Bearer ${userStore.token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    successMessage.value = 'Ï£ºÏ†úÍ∞Ä ?±Í≥µ?ÅÏúºÎ°??±Î°ù?òÏóà?µÎãà??
    subject.value = '' 
    loading.value = false
  } catch (error) {
    console.error('Failed to register subject:', error)
    errorMessage.value = error.response?.data?.message || 'Ï£ºÏ†ú ?±Î°ù???§Ìå®?àÏäµ?àÎã§'
    loading.value = false
  }
}

const goBack = () => {
  router.push('/lobby')
}
</script>

<template>
  <div class="register-subject">
    <h1>Ï£ºÏ†ú ?±Î°ù?òÍ∏∞</h1>
    
    <div class="form-container">
      <div class="form-group">
        <label for="subject">Ï£ºÏ†ú:</label>
        <input 
          id="subject" 
          v-model="subject" 
          :disabled="loading"
          placeholder="?±Î°ù??Ï£ºÏ†úÎ•??ÖÎ†•?òÏÑ∏??
          type="text"
        />
      </div>
      
      <div class="actions">
        <button 
          :disabled="loading"
          class="btn primary"
          @click="registerSubject"
        >
          {{ loading ? 'Ï≤òÎ¶¨ Ï§?..' : '?±Î°ù?òÍ∏∞' }}
        </button>
        <button class="btn secondary" @click="goBack">?åÏïÑÍ∞ÄÍ∏?/button>
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-subject {
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

input {
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
</style>
