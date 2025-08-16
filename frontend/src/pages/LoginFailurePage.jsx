import React, {useEffect, useMemo, useRef} from 'react'
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom'
import {Alert, Anchor, Box, Button, Container, Group, Paper, Stack, Text, Title} from '@mantine/core'
import {IconAlertCircle} from '@tabler/icons-react'
import {motion} from 'framer-motion'
import {useI18n} from '../i18n/i18n.jsx'
import {Events, trackEvent} from '../utils/analytics'
import {mapAuthCodeToUiPreset} from '../utils/authErrorMapping'
import {useRedirectCountdown} from '../hooks/useRedirectCountdown'
import {persistReturnTo, sanitizeReturnTo} from '../utils/redirect'
import useDebouncedCallback from '../hooks/useDebouncedCallback'

const MotionContainer = motion.create(Container)
const MotionPaper = motion.create(Paper)

function parseIntSafe(value, fallback) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return n
}

export default function LoginFailurePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()

  const errorCode = searchParams.get('errorCode') || 'UNKNOWN_ERROR'
  const errorMessage = searchParams.get('errorMessage') || ''
  const nickname = searchParams.get('nickname') || ''
  const returnToRaw = searchParams.get('returnTo')
  const returnTo = sanitizeReturnTo(returnToRaw)
  const retryAfterSecondsParam = searchParams.get('retryAfterSeconds')

  const preset = useMemo(() => mapAuthCodeToUiPreset(errorCode), [errorCode])
  const autoRedirectSeconds = useMemo(() => {
    const v = parseIntSafe(retryAfterSecondsParam, preset.defaultRedirectSec)
    return Math.max(0, Math.min(60, v))
  }, [retryAfterSecondsParam, preset])

  const allowAuto = preset.allowAutoRedirect && autoRedirectSeconds > 0

  const titleRef = useRef(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    trackEvent(Events.AuthFailedViewed, {
      errorCode,
      hasReturnTo: Boolean(returnTo),
      uiVersion: 'page',
    })
  }, [errorCode, returnTo])

  const onRedirectDone = () => {
    trackEvent(Events.NavRedirect, { to: '/login', reason: 'auto', delayMs: autoRedirectSeconds * 1000 })
    if (returnTo) persistReturnTo(returnTo)
    const query = new URLSearchParams()
    if (returnTo) query.set('returnTo', returnTo)
    if (nickname) query.set('nickname', nickname)
    navigate(`/login?${query.toString()}`, { replace: true })
  }

  const { remaining, canceled, cancel } = useRedirectCountdown({
    seconds: autoRedirectSeconds,
    enabled: allowAuto,
    onDone: onRedirectDone,
  })

  const onRetry = useDebouncedCallback(() => {
    trackEvent(Events.LoginRetryClicked, { errorCode })
    if (returnTo) persistReturnTo(returnTo)
    const query = new URLSearchParams()
    if (returnTo) query.set('returnTo', returnTo)
    if (nickname) query.set('nickname', nickname)
    trackEvent(Events.NavRedirect, { to: '/login', reason: 'user' })
    navigate(`/login?${query.toString()}`)
  }, 300)

  const onHome = () => {
    trackEvent(Events.UiClick, { componentId: 'btn-home', action: 'click', page: 'LoginFailurePage' })
    navigate('/')
  }

  const subtitleKey = preset.subtitleKey

  return (
    <Box 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f7f9fc 0%, #e3f2fd 100%)',
        padding: '16px'
      }}
    >
      <MotionContainer size="sm">
        <MotionPaper
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          shadow="lg"
          p="xl"
          radius="xl"
          role="region" 
          aria-labelledby="auth-failure-title" 
          aria-describedby="auth-failure-desc"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <Stack gap="xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Group gap="md" align="center">
                <IconAlertCircle size={40} color="#f44336" aria-hidden />
                <Title
                  id="auth-failure-title"
                  ref={titleRef}
                  tabIndex={-1}
                  order={1}
                  fw={700}
                >
                  {t('auth.failure.title')}
                </Title>
              </Group>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Stack gap="xs">
                <Text id="auth-failure-desc" size="md">
                  {t(subtitleKey)}
                </Text>
                {errorMessage && (
                  <Alert color="blue" variant="light" mt="xs">
                    {errorMessage}
                  </Alert>
                )}
              </Stack>
            </motion.div>

            {allowAuto && !canceled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Text size="sm" c="dimmed">
                  {t('auth.failure.secondary', { seconds: remaining })}
                  {' '}
                  <Anchor 
                    component="button" 
                    type="button" 
                    onClick={() => cancel()}
                    style={{ marginLeft: '8px' }}
                  >
                    {t('auth.failure.secondary.cancel')}
                  </Anchor>
                </Text>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Group gap="md">
                <Button
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  onClick={() => onRetry.run?.() || onRetry()}
                  autoFocus
                >
                  {t('auth.failure.cta.retry')}
                </Button>
                <Button variant="outline" onClick={onHome}>
                  {t('auth.failure.cta.home')}
                </Button>
              </Group>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Group gap="md" mt="xs">
                <Anchor
                  component={RouterLink}
                  to="/login?mode=forgot"
                  onClick={() => trackEvent(Events.ForgotPasswordClicked, { page: 'LoginFailurePage' })}
                  size="sm"
                >
                  {t('auth.failure.help.forgot')}
                </Anchor>
                <Anchor
                  href="mailto:support@example.com"
                  onClick={() => trackEvent(Events.UiClick, { componentId: 'link-contact', action: 'click', page: 'LoginFailurePage' })}
                  size="sm"
                >
                  {t('auth.failure.help.contact')}
                </Anchor>
              </Group>
            </motion.div>
          </Stack>
        </MotionPaper>
      </MotionContainer>
    </Box>
  )
}
