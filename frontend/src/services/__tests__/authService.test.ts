import {authService} from '../authService';
import {apiService} from '../api';

jest.mock('../api');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      success: true,
      userId: 1,
      nickname: 'testUser',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.login({
      nickname: 'testUser',
      password: 'password123',
    });

    expect(result).toEqual(mockResponse);
    expect(apiService.post).toHaveBeenCalledWith('/auth/login', {
      nickname: 'testUser',
      password: 'password123',
    });
  });

  it('should refresh session successfully', async () => {
    const mockResponse = {
      success: true,
      userId: 1,
      nickname: 'testUser',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.refreshSession();

    expect(result).toEqual(mockResponse);
    expect(apiService.post).toHaveBeenCalledWith('/auth/refresh-session');
  });

  it('should handle logout', async () => {
    (apiService.post as jest.Mock).mockResolvedValue({});

    await authService.logout();

    expect(apiService.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('should check auth status', async () => {
    const mockResponse = {
      success: true,
      userId: 1,
      nickname: 'testUser',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await authService.checkAuthStatus();

    expect(result).toBe(true);
  });

  it('should return false when auth check fails', async () => {
    (apiService.post as jest.Mock).mockRejectedValue(new Error('Auth failed'));

    const result = await authService.checkAuthStatus();

    expect(result).toBe(false);
  });
});
