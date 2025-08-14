export function trackEvent(event, payload = {}) {
  try {
    const safePayload = JSON.parse(JSON.stringify(payload, (key, value) => {
      const piiKeys = ['password', 'token', 'email']
      if (piiKeys.includes(key)) return undefined
      return value
    }))

    const record = {
      event,
      ts: Date.now(),
      ...safePayload,
    }

    if (typeof window !== 'undefined' && window?.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('analytics:event', { detail: record }))
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[analytics]', record)
    }
  } catch (e) {
  }
}

export const Events = {
  AuthFailedViewed: 'auth.login_failed',
  LoginRetryClicked: 'auth.login_retry_clicked',
  ForgotPasswordClicked: 'auth.forgot_password_clicked',
  RedirectStarted: 'auth.redirect_started',
  UiClick: 'ui.click',
  NavRedirect: 'nav.redirect',
}
