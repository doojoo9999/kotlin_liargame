import React, {useEffect, useMemo, useRef} from 'react'
import {useNavigate} from 'react-router-dom'
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, Stack, Typography,} from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import {useI18n} from '../i18n/i18n.jsx'
import {Events, trackEvent} from '../utils/analytics'
import {mapAuthCodeToUiPreset} from '../utils/authErrorMapping'
import {useRedirectCountdown} from '../hooks/useRedirectCountdown'
import {persistReturnTo, sanitizeReturnTo} from '../utils/redirect'
import useDebouncedCallback from '../hooks/useDebouncedCallback'

export default function LoginFailureDialog({
  open,
  onClose,
  errorCode = 'UNKNOWN_ERROR',
  errorMessage = '',
  nickname = '',
  returnTo: returnToProp,
  retryAfterSeconds,
}) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const returnTo = sanitizeReturnTo(returnToProp)

  useEffect(() => {
    if (open) {
      trackEvent(Events.AuthFailedViewed, {
        errorCode,
        hasReturnTo: Boolean(returnTo),
        uiVersion: 'modal',
      })
    }
  }, [open, errorCode, returnTo])

  const preset = useMemo(() => mapAuthCodeToUiPreset(errorCode), [errorCode])
  const autoRedirectSeconds = useMemo(() => {
    const v = Number.isFinite(Number(retryAfterSeconds)) ? Number(retryAfterSeconds) : preset.defaultRedirectSec
    return Math.max(0, Math.min(60, v))
  }, [retryAfterSeconds, preset])
  const allowAuto = preset.allowAutoRedirect && autoRedirectSeconds > 0

  const titleId = 'login-failure-dialog-title'
  const descId = 'login-failure-dialog-desc'
  const titleRef = useRef(null)

  const { remaining, canceled, cancel } = useRedirectCountdown({
    seconds: autoRedirectSeconds,
    enabled: open && allowAuto,
    onDone: () => {
      trackEvent(Events.NavRedirect, { to: '/login', reason: 'auto', delayMs: autoRedirectSeconds * 1000 })
      if (returnTo) persistReturnTo(returnTo)
      const query = new URLSearchParams()
      if (returnTo) query.set('returnTo', returnTo)
      if (nickname) query.set('nickname', nickname)
      navigate(`/login?${query.toString()}`, { replace: true })
    }
  })

  const onRetry = useDebouncedCallback(() => {
    trackEvent(Events.LoginRetryClicked, { errorCode })
    if (returnTo) persistReturnTo(returnTo)
    const query = new URLSearchParams()
    if (returnTo) query.set('returnTo', returnTo)
    if (nickname) query.set('nickname', nickname)
    navigate(`/login?${query.toString()}`)
  }, 300)

  const onHome = () => {
    trackEvent(Events.UiClick, { componentId: 'btn-home', action: 'click', page: 'LoginFailureDialog' })
    navigate('/')
  }

  useEffect(() => {
    if (open) {
      // Focus the title for screen readers
      setTimeout(() => titleRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
      role="dialog"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id={titleId} tabIndex={-1} ref={titleRef} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ErrorOutlineIcon color="error" aria-hidden />
        {t('auth.failure.title')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography id={descId} component="p" sx={{ mb: 1 }}>
          {t(preset.subtitleKey)}
        </Typography>
        {errorMessage && (
          <Typography component="p" color="text.secondary">
            {errorMessage}
          </Typography>
        )}
        {allowAuto && !canceled && (
          <Typography component="p" variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('auth.failure.secondary', { seconds: remaining })}
            {' '}
            <Link component="button" type="button" onClick={() => cancel()} sx={{ ml: 1 }}>
              {t('auth.failure.secondary.cancel')}
            </Link>
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%', p: 1 }}>
          <Button onClick={() => onRetry.run?.() || onRetry()} variant="contained">{t('auth.failure.cta.retry')}</Button>
          <Button onClick={onHome} variant="outlined">{t('auth.failure.cta.home')}</Button>
          <Button onClick={onClose}>{t('auth.failure.cta.close')}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
