// 인증 관련 타입
export interface User {
  id: number;
  nickname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  stats?: UserStats;
}

export interface UserStats {
  totalGames: number;
  winRate: number;
  citizenWins: number;
  liarWins: number;
  averageGameDuration: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
