import React, {lazy, Suspense, useEffect, useState} from 'react'
import {Alert, Box, Button, Container, Loader, Stack, Text, TextInput, Title} from '@mantine/core'
import {IconDeviceGamepad2, IconLogin} from '@tabler/icons-react'
import {motion} from 'framer-motion'
import {useGame} from '../context/GameContext'
import {useNavigate, useSearchParams} from 'react-router-dom'
import {mapAuthCodeToUiPreset, mapHttpErrorToAuthCode} from '../utils/authErrorMapping'
import {getReturnToFromQuery, persistReturnTo} from '../utils/redirect'
import {Events, trackEvent} from '../utils/analytics'
import {Controller, useForm} from 'react-hook-form'
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {notifications} from '@mantine/notifications'
import {GlassmorphismCard} from '../components/GlassmorphismCard'

const AnimatedBackground = lazy(() => import('../components/AnimatedBackground').then(module => ({ default: module.AnimatedBackground })));
const FloatingGamepadIcons = lazy(() => import('../components/FloatingGamepadIcons').then(module => ({ default: module.FloatingGamepadIcons })));
const Confetti = lazy(() => import('react-confetti'));


const MotionContainer = motion.create(Container)

const schema = z.object({
  nickname: z.string()
    .min(1, '닉네임을 입력해주세요.')
    .min(2, '닉네임은 최소 2글자 이상이어야 합니다.')
    .max(12, '닉네임은 최대 12글자까지 가능합니다.')
    .refine((value) => !/[<>\"\'&]/.test(value), '닉네임에 특수문자는 사용할 수 없습니다.')
})

function LoginPage() {
  const { login, loading, error } = useGame()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: { nickname: '' },
  })

  const nicknameValue = watch('nickname')

  useEffect(() => {
    // Prefill nickname and persist safe returnTo on arrival
    const prefillNick = searchParams.get('nickname')
    if (prefillNick) setValue('nickname', prefillNick)
    const safeReturnTo = getReturnToFromQuery()
    if (safeReturnTo) persistReturnTo(safeReturnTo)
  }, [searchParams, setValue])

  // Window resize handler for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const onSubmit = async (data) => {
    console.log('[DEBUG] onSubmit called with data:', data) // 추가
    const trimmedNickname = data.nickname.trim()
    console.log('[DEBUG] Trimmed nickname:', trimmedNickname) // 추가

    try {
      console.log('[DEBUG_LOG] Attempting login with nickname:', trimmedNickname)
      await login(trimmedNickname)

      // Trigger confetti celebration
      setShowConfetti(true)
      
      notifications.show({
        title: '🎉 로그인 성공!',
        message: `${trimmedNickname}님, 환영합니다! 게임을 시작하세요! 🎮✨`,
        color: 'green',
        autoClose: 3000,
      })
      
      console.log('[DEBUG_LOG] Login successful')
      
      // 성공 메시지와 축하 효과를 잠시 보여준 후 로비로 이동합니다.
      // 페이지가 전환되면 Confetti 컴포넌트는 자동으로 unmount되므로 수동으로 숨기는 로직은 불필요합니다.
      setTimeout(() => {
        navigate('/lobby')
      }, 1500) // 1.5초 후 이동하여 사용자가 성공 피드백을 충분히 인지하도록 합니다.
    } catch (error) {
      console.error('[DEBUG] Login error caught:', error) // 추가
      console.error('[DEBUG_LOG] Login failed:', error)

      const errorCode = mapHttpErrorToAuthCode(error)
      const preset = mapAuthCodeToUiPreset(errorCode)
      const returnTo = getReturnToFromQuery()

      // Only include server-provided message for network/server errors to avoid leaking sensitive info
      let errorMessage = ''
      if (errorCode === 'SERVER_ERROR' || errorCode === 'NETWORK_ERROR') {
        errorMessage = error.response?.data?.message || ''
      }

      const params = new URLSearchParams()
      params.set('errorCode', errorCode)
      if (errorMessage) params.set('errorMessage', errorMessage)
      if (returnTo) params.set('returnTo', returnTo)
      if (trimmedNickname) params.set('nickname', trimmedNickname)
      if (preset.defaultRedirectSec) params.set('retryAfterSeconds', String(preset.defaultRedirectSec))

      trackEvent(Events.RedirectStarted, { to: '/auth/login-failed', reason: 'error' })
      navigate(`/auth/login-failed?${params.toString()}`)
    }
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 배경과 같은 비핵심 UI는 fallback을 null로 설정하여 불필요한 로더 표시를 방지합니다. */}
      <Suspense fallback={null}>
        {/* Advanced Animated Background */}
        <AnimatedBackground />
        
        {/* Floating Gamepad Icons */}
        <FloatingGamepadIcons />
      </Suspense>

      {/* Confetti Celebration */}
      {showConfetti && (
        <Suspense fallback={null}>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200} // 성능 최적화를 위해 파티클 수 조정
            gravity={0.2} // 좀 더 부드러운 효과를 위해 중력 조정
            colors={[
              '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', 
              '#ffeaa7', '#fab1a0', '#fd79a8', '#e17055',
              '#667eea', '#764ba2', '#f093fb'
            ]}
            style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000 }}
          />
        </Suspense>
      )}

      <MotionContainer size="xl" style={{ position: 'relative', zIndex: 10, maxWidth: '580px', width: '95%' }}>
        <GlassmorphismCard style={{ padding: '48px 40px', margin: '24px' }}>
          {/* Game Title and Icon with Enhanced Animations */}
          <Stack gap="xl" py="20px" m="48px">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.2,
                type: "spring",
                stiffness: 200
              }}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.5 }
              }}
            >
              <IconDeviceGamepad2 
                size={80}
                color="#ffffff"
                style={{ 
                  marginBottom: '16px'
                }}
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
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  marginBottom: '16px',
                  fontSize: '2.5rem'
                }}
              >
                라이어 게임
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
                  color: '#cbd5e1',
                  marginBottom: '24px',
                  fontWeight: '500',
                  fontSize: '1.2rem'
                }}
              >
                닉네임을 입력하고 게임을 시작하세요! 🎮
              </Text>
            </motion.div>
          </Stack>

          {/* Enhanced Login Form */}
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Stack gap="3px" m="40px">
              <Controller
                name="nickname"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label="닉네임"
                    placeholder="2-12글자의 닉네임을 입력해주세요"
                    error={errors.nickname?.message}
                    disabled={loading.auth}
                    maxLength={12}
                    autoComplete="username"
                    autoFocus
                    size="lg"
                    radius="md"
                    styles={{
                      input: {
                        background: '#ffffff',
                        border: '2px solid #e2e8f0',
                        padding: '16px 20px',
                        fontSize: '16px',
                        color: '#2d3748',
                        '&:focus': {
                          borderColor: '#667eea'
                        }
                      },
                      label: {
                        color: '#ffffff',
                        fontWeight: 500,
                        marginBottom: '8px'
                      }
                    }}
                  />
                )}
              />

              <Button
                type="submit"
                onClick={() => {
                  console.log('[DEBUG] Button clicked')
                  console.log('[DEBUG] Button disabled state:', loading.auth || isSubmitting || !nicknameValue?.trim())
                  console.log('[DEBUG] Form state:', { loading: loading.auth, isSubmitting, nicknameValue, trimmed: nicknameValue?.trim() })
                }}
                disabled={loading.auth || isSubmitting || !nicknameValue?.trim()}
                leftSection={loading.auth ? <Loader size={20} /> : <IconLogin size={20} />}
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan' }}
                size="lg"
                fullWidth
                radius="md"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  padding: '16px 32px',
                  marginTop: '8px'
                }}
              >
                {loading.auth ? '접속 중...' : '게임 시작'}
              </Button>
            </Stack>
          </motion.form>

          {/* Enhanced Error Display */}
          {error.auth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              <Alert 
                color="red"
                radius="md"
                mb="md"
                style={{
                  background: 'rgba(255, 107, 107, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  color: '#ff6b6b',
                  textShadow: '0 0 10px rgba(255, 107, 107, 0.5)'
                }}
              >
                {error.auth}
              </Alert>
            </motion.div>
          )}

          {/* Enhanced Game Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div
              style={{
                padding: '24px',
                marginTop: '40px',
                borderRadius: '16px',
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.1) 0%, 
                    rgba(255, 255, 255, 0.05) 100%
                  )
                `,
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left'
              }}
              whileHover={{ 
                scale: 1.02,
                background: `
                  linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.15) 0%, 
                    rgba(255, 255, 255, 0.08) 100%
                  )
                `
              }}
              transition={{ duration: 0.3 }}
            >
              <Text 
                fw="bold"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '12px',
                  fontSize: '16px',
                  textShadow: '0 0 10px rgba(76, 236, 196, 0.3)'
                }}
              >
                🎯 게임 방법:
              </Text>
              <Text 
                size="sm"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.8,
                  fontSize: '14px'
                }}
              >
                🎭 플레이어 중 한 명이 라이어가 됩니다<br />
                📝 라이어를 제외한 모든 플레이어는 같은 주제를 받습니다<br />
                🎪 라이어는 다른 주제나 가짜 키워드를 받습니다<br />
                🕵️ 대화를 통해 라이어를 찾아내세요!
              </Text>
            </motion.div>
          </motion.div>

          {/* Enhanced Version Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Text 
              size="xs"
              style={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '24px',
                textAlign: 'center'
              }}
            >
              ⚡ Liar Game v2.0 - Powered by Advanced Gaming UI ⚡
            </Text>
          </motion.div>
        </GlassmorphismCard>
      </MotionContainer>
    </Box>
  )
}

export default LoginPage
