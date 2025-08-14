import React, {createContext, useContext, useMemo, useState} from 'react'

const I18nContext = createContext()

const resources = {
  ko: {
    'auth.failure.title': '로그인에 실패했어요',
    'auth.failure.subtitle.INVALID_CREDENTIALS': '아이디 또는 비밀번호를 확인해주세요.',
    'auth.failure.subtitle.ACCOUNT_LOCKED': '계정이 잠겼어요. 잠시 후 다시 시도하거나 문의해주세요.',
    'auth.failure.subtitle.NETWORK_ERROR': '네트워크 상태를 확인 후 다시 시도해 주세요.',
    'auth.failure.subtitle.SERVER_ERROR': '일시적인 오류입니다. 잠시 후 다시 시도해 주세요.',
    'auth.failure.subtitle.UNKNOWN_ERROR': '문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
    'auth.failure.secondary': '{seconds}초 후 로그인 페이지로 이동합니다.',
    'auth.failure.secondary.cancel': '취소',
    'auth.failure.cta.retry': '다시 로그인',
    'auth.failure.cta.home': '홈으로',
    'auth.failure.cta.close': '닫기',
    'auth.failure.help.contact': '문의',
    'auth.failure.help.forgot': '비밀번호 찾기',
  },
  en: {
    'auth.failure.title': "We couldn't log you in",
    'auth.failure.subtitle.INVALID_CREDENTIALS': 'Please check your username or password.',
    'auth.failure.subtitle.ACCOUNT_LOCKED': 'Your account is locked. Try again later or contact support.',
    'auth.failure.subtitle.NETWORK_ERROR': 'Please check your network and try again.',
    'auth.failure.subtitle.SERVER_ERROR': 'Temporary error. Please try again later.',
    'auth.failure.subtitle.UNKNOWN_ERROR': 'Something went wrong. Please try again later.',
    'auth.failure.secondary': 'Redirecting to login in {seconds}s.',
    'auth.failure.secondary.cancel': 'Cancel',
    'auth.failure.cta.retry': 'Retry login',
    'auth.failure.cta.home': 'Go home',
    'auth.failure.cta.close': 'Close',
    'auth.failure.help.contact': 'Contact',
    'auth.failure.help.forgot': 'Forgot password',
  }
}

function interpolate(template, params) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = params[key]
    return v === undefined || v === null ? '' : String(v)
  })
}

export function I18nProvider({ children, defaultLocale = 'ko' }) {
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get('lang')
  const [locale, setLocale] = useState((fromUrl && resources[fromUrl]) ? fromUrl : defaultLocale)

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, params) => {
      const dict = resources[locale] || resources.ko
      const str = dict[key] || key
      return interpolate(str, params)
    }
  }), [locale])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export default I18nContext
