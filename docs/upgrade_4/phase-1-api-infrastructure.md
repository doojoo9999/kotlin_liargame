# Phase 1: API Infrastructure Setup

## 목표
백엔드 API와의 통신을 위한 기본 인프라를 구축합니다. HTTP 클라이언트, 오류 처리, 타입 정의 등의 기반을 마련합니다.

## 전제 조건
- 백엔드 서버가 `http://localhost:8080`에서 실행 중
- 프론트엔드 개발 서버가 `http://localhost:3000`에서 실행 중

## 주요 작업

### 1. 필요 패키지 설치

```bash
npm install axios
npm install -D @types/axios
```

### 2. API 서비스 레이어 구현

**파일**: `src/services/api.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1',
      timeout: 10000,
      withCredentials: true, // 세션 기반 인증용
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.message || error.message,
        });
        
        // 401 오류 시 로그인 페이지로 리다이렉트
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config).then(response => response.data);
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config).then(response => response.data);
  }

  public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config).then(response => response.data);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config).then(response => response.data);
  }
}

export const apiService = new ApiService();
```

### 3. 타입 정의

**파일**: `src/types/api.ts`

```typescript
// 기본 API 응답 형태
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// API 오류 형태
export interface ApiError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details?: Record<string, any>;
}

// 게임 관련 기본 타입들
export type GamePhase = 
  | 'WAITING_FOR_PLAYERS'
  | 'SPEECH'
  | 'VOTING_FOR_LIAR'
  | 'DEFENDING'
  | 'VOTING_FOR_SURVIVAL'
  | 'GUESSING_WORD'
  | 'GAME_OVER';

export type GameState = 'WAITING' | 'IN_PROGRESS' | 'ENDED';

export type GameMode = 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';

// 플레이어 타입
export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  state: string;
  hint?: string;
  defense?: string;
  votesReceived: number;
  hasVoted: boolean;
}

// 게임 생성 요청
export interface CreateGameRequest {
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: GameMode;
  subjectIds: number[];
  useRandomSubjects: boolean;
  randomSubjectCount: number;
  targetPoints: number;
}

// 게임 참여 요청
export interface JoinGameRequest {
  gameNumber: number;
}

// 게임방 정보
export interface GameRoom {
  gameNumber: number;
  gameOwner: string;
  gameState: GameState;
  gameParticipants: number;
  currentPlayerCount: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: GameMode;
  createdAt: string;
  subjects: string[];
}
```

### 4. API 엔드포인트 상수

**파일**: `src/constants/apiEndpoints.ts`

```typescript
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-session',
  },
  // 게임 관리
  GAME: {
    CREATE: '/game/create',
    JOIN: '/game/join',
    LEAVE: '/game/leave',
    START: '/game/start',
    ROOMS: '/game/rooms',
    STATE: '/game', // /{gameNumber}
    RESULT: '/game/result', // /result/{gameNumber}
  },
  // 게임 플레이
  GAME_PLAY: {
    HINT: '/game/hint',
    VOTE: '/game/cast-vote',
    FINAL_VOTE: '/game/vote/final',
    DEFENSE: '/game/submit-defense',
    END_DEFENSE: '/game/defense/end',
    GUESS_WORD: '/game/guess-word',
    END_ROUND: '/game/end-of-round',
  },
  // 채팅
  CHAT: {
    SEND: '/chat/send',
    HISTORY: '/chat/history',
  },
} as const;
```

### 5. 환경변수 설정

**파일**: `.env.local`

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api/v1
REACT_APP_WS_URL=http://localhost:8080/ws
```

### 6. 기본 오류 처리 유틸리티

**파일**: `src/utils/errorHandling.ts`

```typescript
import { ApiError } from '../types/api';

export class ApiException extends Error {
  public readonly status: number;
  public readonly apiError: ApiError;

  constructor(status: number, apiError: ApiError) {
    super(apiError.message);
    this.status = status;
    this.apiError = apiError;
    this.name = 'ApiException';
  }
}

export function handleApiError(error: any): never {
  if (error.response) {
    // 서버가 응답했지만 오류 상태 코드
    const apiError: ApiError = error.response.data || {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: error.config?.url || 'unknown',
    };
    
    throw new ApiException(error.response.status, apiError);
  } else if (error.request) {
    // 요청은 보냈지만 응답 없음
    throw new ApiException(0, {
      success: false,
      error: 'NETWORK_ERROR',
      message: '서버와의 연결에 실패했습니다.',
      timestamp: new Date().toISOString(),
      path: 'network',
    });
  } else {
    // 요청 설정 중 오류
    throw new ApiException(0, {
      success: false,
      error: 'CLIENT_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      path: 'client',
    });
  }
}
```

### 7. 기본 테스트 파일

**파일**: `src/services/__tests__/api.test.ts`

```typescript
import { apiService } from '../api';

// Mock axios
jest.mock('axios');

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make GET request successfully', async () => {
    const mockData = { success: true, data: 'test' };
    
    // axios 모킹은 실제 테스트 시 구현
    // expect(await apiService.get('/test')).toEqual(mockData);
  });

  it('should make POST request successfully', async () => {
    const mockData = { success: true, data: 'created' };
    const requestData = { name: 'test' };
    
    // axios 모킹은 실제 테스트 시 구현
    // expect(await apiService.post('/test', requestData)).toEqual(mockData);
  });

  it('should handle API errors correctly', async () => {
    // 오류 처리 테스트는 실제 테스트 시 구현
  });
});
```

## 검증 체크리스트

완료 후 다음 사항들을 확인하세요:

### ✅ 파일 생성 확인
- [ ] `src/services/api.ts`
- [ ] `src/types/api.ts`
- [ ] `src/constants/apiEndpoints.ts`
- [ ] `src/utils/errorHandling.ts`
- [ ] `.env.local`
- [ ] `src/services/__tests__/api.test.ts`

### ✅ 기능 테스트
1. **API 클라이언트 초기화 테스트**
   ```typescript
   import { apiService } from './src/services/api';
   console.log('API Service initialized:', !!apiService);
   ```

2. **환경변수 로딩 테스트**
   ```typescript
   console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
   console.log('WebSocket URL:', process.env.REACT_APP_WS_URL);
   ```

3. **타입 확인 테스트**
   ```typescript
   import { GamePhase, Player } from './src/types/api';
   const phase: GamePhase = 'WAITING_FOR_PLAYERS';
   console.log('Types working:', phase);
   ```

### ✅ 다음 단계 준비
- [ ] axios가 정상 설치되었는지 확인
- [ ] TypeScript 컴파일 오류가 없는지 확인
- [ ] 브라우저 콘솔에서 모듈 import 테스트

## 예상 문제점 및 해결방법

### 문제 1: CORS 오류
```
Access to XMLHttpRequest at 'http://localhost:8080' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**해결**: 백엔드에서 CORS 설정이 필요합니다. 백엔드팀에 요청하세요.

### 문제 2: 환경변수 로딩 실패
```
process.env.REACT_APP_API_BASE_URL is undefined
```
**해결**: `.env.local` 파일이 프로젝트 루트에 있는지 확인하고, 개발 서버를 재시작하세요.

### 문제 3: TypeScript 타입 오류
```
Property 'data' does not exist on type 'AxiosResponse<any>'
```
**해결**: `@types/axios` 패키지가 설치되었는지 확인하고, axios import 방식을 확인하세요.

## 성공 기준

Phase 1이 성공적으로 완료되면:
- ✅ API 클라이언트가 백엔드와 통신할 수 있음
- ✅ 오류 처리가 적절히 동작함
- ✅ 모든 타입 정의가 올바름
- ✅ 환경변수가 정상 로딩됨

다음 단계 (Phase 2: Authentication)를 진행할 수 있습니다.