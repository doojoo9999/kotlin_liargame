import React, {useState} from 'react'
import {Box, Button, Container, Loader, Paper, PasswordInput, Stack, Text, Title} from '@mantine/core'
import {IconLogin, IconShield} from '@tabler/icons-react'
import {motion} from 'framer-motion'
import {useNavigate} from 'react-router-dom'
import apiClient from '../api/apiClient'
import {notifications} from '@mantine/notifications'

const MotionContainer = motion.create(Container)
const MotionPaper = motion.create(Paper)

function AdminLoginPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  const handlePasswordChange = (event) => {
    const value = event.target.value
    setPassword(value)

    if (validationError) {
      setValidationError('')
    }
  }

  const validatePassword = (password) => {
    if (!password || password.trim().length === 0) {
      return '관리자 비밀번호를 입력해주세요.'
    }
    
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedPassword = password.trim()
    const validationError = validatePassword(trimmedPassword)
    
    if (validationError) {
      setValidationError(validationError)
      return
    }

    setLoading(true)

    try {
      console.log('[DEBUG_LOG] Attempting admin login')
      const response = await apiClient.post('/admin/login', { password: trimmedPassword })
      
      // Store admin session data (JWT 토큰 제거)
      localStorage.setItem('isUserAdmin', 'true')
      localStorage.setItem('userData', JSON.stringify({ isAdmin: true }))
      
      notifications.show({
        title: '관리자 로그인 성공!',
        message: '관리자 대시보드로 이동합니다 🛡️',
        color: 'green',
        autoClose: 3000,
      })
      
      console.log('[DEBUG_LOG] Admin login successful')
      
      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        navigate('/admin')
      }, 1000)
      
    } catch (error) {
      console.error('[DEBUG_LOG] Admin login failed:', error)
      
      // Handle specific error cases
      let errorMessage = '관리자 로그인에 실패했습니다.'
      
      if (error.response?.status === 401) {
        errorMessage = '잘못된 관리자 비밀번호입니다.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      notifications.show({
        title: '로그인 실패',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event)
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        padding: '16px'
      }}
    >
      <MotionContainer size="sm">
        <MotionPaper
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          shadow="xl"
          p="xl"
          radius="xl"
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}
        >
          {/* Admin Title and Icon */}
          <Stack gap="md" mb="xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <IconShield 
                size={64}
                color="#ff6b6b"
                style={{ marginBottom: '16px' }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Title 
                order={1}
                style={{ 
                  fontWeight: 'bold',
                  color: '#ff6b6b',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  marginBottom: '16px'
                }}
              >
                관리자 페이지
              </Title>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Text 
                size="lg"
                style={{ 
                  color: 'rgba(0, 0, 0, 0.6)',
                  marginBottom: '24px'
                }}
              >
                관리자 비밀번호를 입력하세요
              </Text>
            </motion.div>
          </Stack>

          {/* Login Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Stack gap="lg" mb="lg">
              <PasswordInput
                label="관리자 비밀번호"
                placeholder="관리자 비밀번호를 입력해주세요"
                value={password}
                onChange={handlePasswordChange}
                onKeyPress={handleKeyPress}
                error={validationError}
                disabled={loading}
                size="lg"
                radius="md"
                autoComplete="current-password"
                autoFocus
                style={{ width: '100%' }}
              />

              <Button
                type="submit"
                variant="gradient"
                gradient={{ from: 'red', to: 'orange' }}
                size="lg"
                disabled={loading || !password.trim()}
                leftSection={loading ? <Loader size={20} /> : <IconLogin size={20} />}
                fullWidth
                radius="md"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none'
                }}
              >
                {loading ? '접속 중...' : '관리자 페이지 접속'}
              </Button>
            </Stack>
          </motion.form>

          {/* Back to Main */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button
              variant="subtle"
              color="gray"
              onClick={() => navigate('/')}
              style={{
                textTransform: 'none'
              }}
            >
              메인 페이지로 돌아가기
            </Button>
          </motion.div>
        </MotionPaper>
      </MotionContainer>
    </Box>
  )
}

export default AdminLoginPage