
export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DUPLICATE_NICKNAME: 'DUPLICATE_NICKNAME',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

export function mapHttpErrorToAuthCode(error) {
  if (!error) return AuthErrorCodes.UNKNOWN_ERROR
  if (error.code === 'ERR_NETWORK') return AuthErrorCodes.NETWORK_ERROR

  const status = error.response?.status
  const serverMessage = error.response?.data?.message || error.response?.data?.error || ''
  const msg = typeof serverMessage === 'string' ? serverMessage : ''
  const isDuplicateNickname = msg.includes('이미 사용 중') || msg.includes('이미 사용중') || msg.includes('비인증 닉네임')

  switch (status) {
    case 400:
      return isDuplicateNickname ? AuthErrorCodes.DUPLICATE_NICKNAME : AuthErrorCodes.INVALID_CREDENTIALS
    case 401:
      return AuthErrorCodes.INVALID_CREDENTIALS
    case 403:
      return AuthErrorCodes.ACCOUNT_LOCKED
    case 409:
      return AuthErrorCodes.DUPLICATE_NICKNAME
    case 500:
    case 502:
    case 503:
      return isDuplicateNickname ? AuthErrorCodes.DUPLICATE_NICKNAME : AuthErrorCodes.SERVER_ERROR
    default:
      return error.message?.toLowerCase().includes('network')
        ? AuthErrorCodes.NETWORK_ERROR
        : AuthErrorCodes.UNKNOWN_ERROR
  }
}

export function mapAuthCodeToUiPreset(code) {
  switch (code) {
    case AuthErrorCodes.INVALID_CREDENTIALS:
      return { subtitleKey: 'auth.failure.subtitle.INVALID_CREDENTIALS', suggestRetry: true, allowAutoRedirect: true, defaultRedirectSec: 5 }
    case AuthErrorCodes.ACCOUNT_LOCKED:
      return { subtitleKey: 'auth.failure.subtitle.ACCOUNT_LOCKED', suggestRetry: false, allowAutoRedirect: false, defaultRedirectSec: 0 }
    case AuthErrorCodes.NETWORK_ERROR:
      return { subtitleKey: 'auth.failure.subtitle.NETWORK_ERROR', suggestRetry: true, allowAutoRedirect: true, defaultRedirectSec: 7 }
    case AuthErrorCodes.SERVER_ERROR:
      return { subtitleKey: 'auth.failure.subtitle.SERVER_ERROR', suggestRetry: true, allowAutoRedirect: true, defaultRedirectSec: 7 }
    case AuthErrorCodes.DUPLICATE_NICKNAME:
      return { subtitleKey: 'auth.failure.subtitle.INVALID_CREDENTIALS', suggestRetry: true, allowAutoRedirect: true, defaultRedirectSec: 5 }
    default:
      return { subtitleKey: 'auth.failure.subtitle.UNKNOWN_ERROR', suggestRetry: true, allowAutoRedirect: true, defaultRedirectSec: 5 }
  }
}
