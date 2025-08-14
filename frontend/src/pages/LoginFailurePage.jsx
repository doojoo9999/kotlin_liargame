import React, {useEffect, useMemo, useRef} from 'react'
import {Link as RouterLink, useNavigate, useSearchParams} from 'react-router-dom'
import {Alert, Box, Button, Container, Link, Paper, Stack, Typography} from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import {useI18n} from '../i18n/i18n.jsx'
import {Events, trackEvent} from '../utils/analytics'
import {mapAuthCodeToUiPreset} from '../utils/authErrorMapping'
import {useRedirectCountdown} from '../hooks/useRedirectCountdown'
import {persistReturnTo, sanitizeReturnTo} from '../utils/redirect'
import useDebouncedCallback from '../hooks/useDebouncedCallback'

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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : '#f7f9fc',
      p: 2
    }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }} role="region" aria-labelledby="auth-failure-title" aria-describedby="auth-failure-desc">
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} aria-hidden />
              <Typography
                id="auth-failure-title"
                ref={titleRef}
                tabIndex={-1}
                component="h1"
                variant="h4"
                sx={{ fontWeight: 700 }}
              >
                {t('auth.failure.title')}
              </Typography>
            </Box>

            <Box>
              <Typography id="auth-failure-desc" component="p" variant="body1">
                {t(subtitleKey)}
              </Typography>
              {errorMessage && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {errorMessage}
                </Alert>
              )}
            </Box>

            {allowAuto && !canceled && (
              <Typography component="p" variant="body2" color="text.secondary">
                {t('auth.failure.secondary', { seconds: remaining })}
                {' '}
                <Link component="button" type="button" onClick={() => cancel()} sx={{ ml: 1 }}>
                  {t('auth.failure.secondary.cancel')}
                </Link>
              </Typography>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onRetry.run?.() || onRetry()}
                autoFocus
              >
                {t('auth.failure.cta.retry')}
              </Button>
              <Button variant="outlined" onClick={onHome}>
                {t('auth.failure.cta.home')}
              </Button>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Link
                component={RouterLink}
                to="/login?mode=forgot"
                onClick={() => trackEvent(Events.ForgotPasswordClicked, { page: 'LoginFailurePage' })}
              >
                {t('auth.failure.help.forgot')}
              </Link>
              <Link
                href="mailto:support@example.com"
                onClick={() => trackEvent(Events.UiClick, { componentId: 'link-contact', action: 'click', page: 'LoginFailurePage' })}
              >
                {t('auth.failure.help.contact')}
              </Link>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
