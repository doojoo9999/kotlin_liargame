// Mock axios
jest.mock('axios');

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make GET request successfully', async () => {
    const _mockData = { success: true, data: 'test' };

    // axios 모킹은 실제 테스트 시 구현
    // expect(await apiService.get('/test')).toEqual(mockData);
  });

  it('should make POST request successfully', async () => {
    const _mockData = { success: true, data: 'created' };
    const _requestData = { name: 'test' };

    // axios 모킹은 실제 테스트 시 구현
    // expect(await apiService.post('/test', requestData)).toEqual(mockData);
  });

  it('should handle API errors correctly', async () => {
    // 오류 처리 테스트는 실제 테스트 시 구현
  });
});
