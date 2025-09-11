import {beforeEach, describe, expect, it, vi} from 'vitest'
import {authService} from '../authService'
import {apiService} from '../api'

vi.mock('../api', () => ({
  apiService: { post: vi.fn() },
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login 성공', async () => {
    ;(apiService.post as any).mockResolvedValue({ success: true, userId: 1, nickname: 'testUser' })
    const res = await authService.login({ nickname: 'testUser' })
    expect(res.nickname).toBe('testUser')
    expect(apiService.post).toHaveBeenCalled()
  })

  it('세션 새로고침 성공', async () => {
    ;(apiService.post as any).mockResolvedValue({ success: true, userId: 1, nickname: 'user' })
    const res = await authService.refreshSession()
    expect(res.success).toBe(true)
  })

  it('checkAuthStatus 실패 시 false', async () => {
    ;(apiService.post as any).mockRejectedValue(new Error('fail'))
    const ok = await authService.checkAuthStatus()
    expect(ok).toBe(false)
  })
})
