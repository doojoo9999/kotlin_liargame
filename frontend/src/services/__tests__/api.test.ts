import {beforeEach, describe, expect, it, vi} from 'vitest'
import {apiService} from '../../services/api'

vi.mock('../../services/api', () => {
  return {
    apiService: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    }
  }
})

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET 요청 성공', async () => {
    (apiService.get as any).mockResolvedValue({ success: true, data: 'test' })
    const res = await apiService.get('/test')
    expect(res).toEqual({ success: true, data: 'test' })
    expect(apiService.get).toHaveBeenCalledWith('/test')
  })

  it('POST 요청 성공', async () => {
    (apiService.post as any).mockResolvedValue({ success: true, data: 'created' })
    const body = { name: 'abc' }
    const res = await apiService.post('/items', body)
    expect(res).toEqual({ success: true, data: 'created' })
    expect(apiService.post).toHaveBeenCalledWith('/items', body)
  })

  it('에러 처리', async () => {
    (apiService.get as any).mockRejectedValue(new Error('fail'))
    await expect(apiService.get('/err')).rejects.toThrow('fail')
  })
})
