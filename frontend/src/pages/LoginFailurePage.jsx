import React, {lazy, Suspense} from 'react'
import {Link as RouterLink} from 'react-router-dom'
import {Box, Button, Container, Stack, Text, Title} from '@mantine/core'
import {IconLogin} from '@tabler/icons-react'
import {GlassmorphismCard} from '../components/GlassmorphismCard'

const AnimatedBackground = lazy(() => import('../components/AnimatedBackground').then(m => ({ default: m.AnimatedBackground })))
const FloatingGamepadIcons = lazy(() => import('../components/FloatingGamepadIcons').then(m => ({ default: m.FloatingGamepadIcons })))

/**
 * 로그인 실패 페이지 - 로그인 페이지와 동일한 유형의 디자인을 적용
 */
function LoginFailurePage() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <AnimatedBackground />
        <FloatingGamepadIcons />
      </Suspense>

      <Container size="xl" style={{ position: 'relative', zIndex: 10, maxWidth: '580px', width: '95%' }}>
        <GlassmorphismCard style={{ padding: '48px 40px', margin: '24px' }}>
          <Stack gap="xl" py="20px" m="16px" align="center">
            <IconLogin size={72} color="#ff6b6b" style={{ marginBottom: '8px' }} />

            <Title order={2} style={{ fontWeight: 'bold', color: '#ffffff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', marginBottom: '8px' }}>
              로그인 실패
            </Title>

            <Text style={{ color: '#e2e8f0', textAlign: 'center', marginBottom: '8px' }}>
              로그인 정보가 올바르지 않거나, 서버에 문제가 발생했습니다. 다시 시도해주세요.
            </Text>

            <Button
              component={RouterLink}
              to="/login"
              size="md"
              radius="md"
              fullWidth
              variant="filled"
              color="indigo"
              styles={{ root: { fontWeight: 700 } }}
            >
              로그인 페이지로 돌아가기
            </Button>
          </Stack>
        </GlassmorphismCard>
      </Container>
    </Box>
  )
}

export default LoginFailurePage