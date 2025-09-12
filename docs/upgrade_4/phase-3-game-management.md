# Phase 3: Game Management APIs

## 목표
게임방 생성, 참여, 나가기 등 기본적인 게임방 관리 기능을 백엔드 API와 연동합니다. 목업 데이터를 실제 API 호출로 대체합니다.

## 전제 조건
- Phase 1 (API Infrastructure) 완료
- Phase 2 (Authentication) 완료
- 백엔드 게임 관리 API가 정상 동작 (`/api/v1/game/*`)

## 주요 작업

### 1. 게임 관련 타입 확장

**파일**: `src/types/game.ts` (기존 파일 수정)

```typescript
// 기존 타입에 추가
export interface GameStateResponse {
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  currentPhase: GamePhase;
  players: Player[];
  gameMode: GameMode;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
  yourRole?: 'CITIZEN' | 'LIAR';
  yourWord?: string;
  accusedPlayer?: Player | null;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string | null;
  subjects: string[];
  turnOrder: string[];
  currentTurnIndex: number;
  phaseEndTime?: string;
  winner?: string | null;
  reason?: string | null;
  targetPoints: number;
  scoreboard: ScoreboardEntry[];
}

export interface ScoreboardEntry {
  userId: number;
  nickname: string;
  isAlive: boolean;
  score: number;
}

export interface GameRoomsResponse {
  gameRooms: GameRoom[];
}

// 투표 응답
export interface VoteResponse {
  gameNumber: number;
  voterUserId: number;
  targetUserId: number;
  isSuccessful: boolean;
  message: string;
}

// 변론 응답
export interface DefenseResponse {
  gameNumber: number;
  playerId: number;
  playerNickname: string;
  defenseText: string;
  success: boolean;
}

// 단어 추측 응답
export interface GuessResponse {
  gameNumber: number;
  guess: string;
  isCorrect: boolean;
  actualWord: string;
  success: boolean;
}
```

### 2. 게임 서비스 구현

**파일**: `src/services/gameService.ts`

```typescript
import { apiService } from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import {
  CreateGameRequest,
  JoinGameRequest,
  GameStateResponse,
  GameRoomsResponse,
  VoteResponse,
  DefenseResponse,
  GuessResponse,
} from '../types/api';

export class GameService {
  // 게임방 관리
  async createGame(gameConfig: CreateGameRequest): Promise<number> {
    try {
      console.log('Creating game with config:', gameConfig);
      const gameNumber = await apiService.post<number>(
        API_ENDPOINTS.GAME.CREATE,
        gameConfig
      );
      console.log('Game created with number:', gameNumber);
      return gameNumber;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  }

  async joinGame(request: JoinGameRequest): Promise<GameStateResponse> {
    try {
      console.log('Joining game:', request.gameNumber);
      const gameState = await apiService.post<GameStateResponse>(
        API_ENDPOINTS.GAME.JOIN,
        request
      );
      console.log('Joined game successfully:', gameState.gameNumber);
      return gameState;
    } catch (error) {
      console.error('Failed to join game:', error);
      throw error;
    }
  }

  async leaveGame(gameNumber: number): Promise<boolean> {
    try {
      console.log('Leaving game:', gameNumber);
      const result = await apiService.post<boolean>(
        API_ENDPOINTS.GAME.LEAVE,
        { gameNumber }
      );
      console.log('Left game successfully');
      return result;
    } catch (error) {
      console.error('Failed to leave game:', error);
      throw error;
    }
  }

  async startGame(gameNumber: number): Promise<GameStateResponse> {
    try {
      console.log('Starting game:', gameNumber);
      const gameState = await apiService.post<GameStateResponse>(
        API_ENDPOINTS.GAME.START,
        { gameNumber }
      );
      console.log('Game started successfully');
      return gameState;
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  async getGameState(gameNumber: number): Promise<GameStateResponse> {
    try {
      const gameState = await apiService.get<GameStateResponse>(
        `${API_ENDPOINTS.GAME.STATE}/${gameNumber}`
      );
      return gameState;
    } catch (error) {
      console.error('Failed to get game state:', error);
      throw error;
    }
  }

  async getActiveRooms(): Promise<GameRoomsResponse> {
    try {
      const response = await apiService.get<GameRoomsResponse>(
        API_ENDPOINTS.GAME.ROOMS
      );
      console.log('Fetched active rooms:', response.gameRooms.length);
      return response;
    } catch (error) {
      console.error('Failed to fetch active rooms:', error);
      throw error;
    }
  }

  // 게임 플레이 액션들 (Phase 5에서 상세 구현)
  async submitHint(gameNumber: number, hint: string): Promise<GameStateResponse> {
    return apiService.post<GameStateResponse>(API_ENDPOINTS.GAME_PLAY.HINT, {
      gameNumber,
      hint,
    });
  }

  async castVote(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    return apiService.post<VoteResponse>(API_ENDPOINTS.GAME_PLAY.VOTE, {
      gameNumber,
      targetUserId,
    });
  }

  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseResponse> {
    return apiService.post<DefenseResponse>(API_ENDPOINTS.GAME_PLAY.DEFENSE, {
      gameNumber,
      defenseText,
    });
  }

  async submitFinalVote(gameNumber: number, voteForExecution: boolean): Promise<GameStateResponse> {
    return apiService.post<GameStateResponse>(API_ENDPOINTS.GAME_PLAY.FINAL_VOTE, {
      gameNumber,
      voteForExecution,
    });
  }

  async guessWord(gameNumber: number, guess: string): Promise<GuessResponse> {
    return apiService.post<GuessResponse>(API_ENDPOINTS.GAME_PLAY.GUESS_WORD, {
      gameNumber,
      guess,
    });
  }
}

export const gameService = new GameService();
```

### 3. 게임 스토어 수정

**파일**: `src/store/gameStore.ts` (기존 파일 수정)

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { gameService } from '../services/gameService';
import { CreateGameRequest, GameStateResponse } from '../types/api';
// ... 기타 imports

// 기존 인터페이스에 API 연동 메서드 추가
interface GameActions {
  // ... 기존 액션들

  // API 연동 액션들
  createGame: (config: CreateGameRequest) => Promise<number>;
  joinGameById: (gameNumber: number) => Promise<void>;
  leaveCurrentGame: () => Promise<void>;
  startCurrentGame: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  
  // 오류 및 로딩 상태
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

// 기존 스토어에 새 액션들 추가
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... 기존 상태들

        // API 연동 액션 구현
        createGame: async (config: CreateGameRequest) => {
          set({ isLoading: true, error: null });
          
          try {
            const gameNumber = await gameService.createGame(config);
            
            set({ 
              gameNumber,
              gameId: gameNumber.toString(),
              isLoading: false 
            });
            
            console.log('Game created in store:', gameNumber);
            return gameNumber;
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to create game',
              isLoading: false 
            });
            throw error;
          }
        },

        joinGameById: async (gameNumber: number) => {
          set({ isLoading: true, error: null });
          
          try {
            const gameState = await gameService.joinGame({ gameNumber });
            
            set({
              gameNumber: gameState.gameNumber,
              gameId: gameState.gameNumber.toString(),
              players: gameState.players.map(p => ({
                id: p.userId.toString(),
                nickname: p.nickname,
                isReady: false, // API에서 ready 상태 확인 필요
                isHost: p.nickname === gameState.gameOwner,
                isOnline: p.isAlive,
                isAlive: p.isAlive,
                role: gameState.yourRole === 'LIAR' ? 'liar' : 'civilian',
              })),
              gamePhase: gameState.currentPhase,
              currentRound: gameState.gameCurrentRound,
              totalRounds: gameState.gameTotalRounds,
              maxPlayers: gameState.gameParticipants,
              currentTopic: gameState.citizenSubject || null,
              currentWord: gameState.yourWord || null,
              isLoading: false,
            });
            
            console.log('Joined game in store:', gameState.gameNumber);
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to join game',
              isLoading: false 
            });
            throw error;
          }
        },

        leaveCurrentGame: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;
          
          set({ isLoading: true, error: null });
          
          try {
            await gameService.leaveGame(gameNumber);
            
            // 게임 상태 초기화
            set({
              ...initialState,
              typingPlayers: new Set(),
              isLoading: false,
            });
            
            console.log('Left game in store');
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to leave game',
              isLoading: false 
            });
            throw error;
          }
        },

        startCurrentGame: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;
          
          set({ isLoading: true, error: null });
          
          try {
            const gameState = await gameService.startGame(gameNumber);
            
            set({
              gamePhase: gameState.currentPhase,
              players: gameState.players.map(p => ({
                id: p.userId.toString(),
                nickname: p.nickname,
                isReady: true,
                isHost: p.nickname === gameState.gameOwner,
                isOnline: p.isAlive,
                isAlive: p.isAlive,
                role: gameState.yourRole === 'LIAR' ? 'liar' : 'civilian',
              })),
              currentTopic: gameState.citizenSubject || null,
              currentWord: gameState.yourWord || null,
              currentTurnPlayerId: gameState.turnOrder[gameState.currentTurnIndex],
              turnOrder: gameState.turnOrder,
              isLoading: false,
            });
            
            console.log('Started game in store');
          } catch (error: any) {
            set({ 
              error: error.message || 'Failed to start game',
              isLoading: false 
            });
            throw error;
          }
        },

        refreshGameState: async () => {
          const { gameNumber } = get();
          if (!gameNumber) return;
          
          try {
            const gameState = await gameService.getGameState(gameNumber);
            
            // 현재 상태 업데이트
            set({
              gamePhase: gameState.currentPhase,
              players: gameState.players.map(p => ({
                id: p.userId.toString(),
                nickname: p.nickname,
                isReady: gameState.gameState !== 'WAITING',
                isHost: p.nickname === gameState.gameOwner,
                isOnline: p.isAlive,
                isAlive: p.isAlive,
                role: gameState.yourRole === 'LIAR' ? 'liar' : 'civilian',
              })),
              currentRound: gameState.gameCurrentRound,
              currentTopic: gameState.citizenSubject || null,
              currentWord: gameState.yourWord || null,
              currentTurnPlayerId: gameState.turnOrder[gameState.currentTurnIndex],
            });
            
            console.log('Refreshed game state in store');
          } catch (error) {
            console.error('Failed to refresh game state:', error);
          }
        },

        // ... 기존 액션들 유지
      }),
      {
        name: 'liar-game-store',
        partialize: (state) => ({ 
          currentPlayer: state.currentPlayer,
          gameId: state.gameId,
          gameNumber: state.gameNumber,
          sessionCode: state.sessionCode
        }),
      }
    )
  )
);
```

### 4. GameRoomsSection 컴포넌트 수정

**파일**: `src/components/lobby/GameRoomsSection.tsx` (기존 파일 수정)

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { gameService } from '@/services/gameService';
import { CreateGameRequest, GameRoom } from '@/types/api';

export function GameRoomsSection() {
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    maxPlayers: 6,
    isPrivate: false
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { nickname } = useAuthStore();

  // 게임방 목록 조회
  const fetchGameRooms = async () => {
    setLoading(true);
    try {
      const response = await gameService.getActiveRooms();
      setGameRooms(response.gameRooms);
      console.log('Fetched game rooms:', response.gameRooms.length);
    } catch (error: any) {
      console.error('Failed to fetch game rooms:', error);
      toast({
        title: "게임방 목록 로드 실패",
        description: error.message || "게임방 목록을 불러올 수 없습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameRooms();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchGameRooms, 30000);
    return () => clearInterval(interval);
  }, []);

  // 게임방 생성
  const handleCreateRoom = async () => {
    if (!newRoom.name.trim()) {
      toast({
        title: "방 이름이 필요합니다",
        description: "게임방 이름을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const gameConfig: CreateGameRequest = {
        gameParticipants: newRoom.maxPlayers,
        gameLiarCount: 1,
        gameTotalRounds: 3,
        gameMode: 'LIARS_KNOW',
        subjectIds: [1, 2, 3], // 기본 주제들 (실제 주제 ID로 수정 필요)
        useRandomSubjects: true,
        randomSubjectCount: 2,
        targetPoints: 10,
      };

      const gameNumber = await gameService.createGame(gameConfig);
      
      // 게임방으로 이동
      navigate(`/game/${gameNumber}`);
      
      toast({
        title: "게임방이 생성되었습니다",
        description: `게임방 번호: ${gameNumber}`,
      });
    } catch (error: any) {
      console.error('Failed to create game:', error);
      toast({
        title: "게임방 생성 실패",
        description: error.message || "게임방을 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsCreateDialogOpen(false);
      setNewRoom({ name: '', maxPlayers: 6, isPrivate: false });
    }
  };

  // 게임방 참여
  const handleJoinRoom = async (gameNumber: number) => {
    setLoading(true);
    try {
      // GameService를 통해 참여 시도 (유효성 검사 포함)
      await gameService.joinGame({ gameNumber });
      
      // 성공 시 게임방으로 이동
      navigate(`/game/${gameNumber}`);
      
      toast({
        title: "게임방에 참여했습니다",
        description: `게임방 번호: ${gameNumber}`,
      });
    } catch (error: any) {
      console.error('Failed to join game:', error);
      toast({
        title: "게임방 참여 실패",
        description: error.message || "게임방에 참여하는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 핸들러
  const refreshRooms = async () => {
    await fetchGameRooms();
    toast({
      title: "목록이 새로고침되었습니다",
      description: "최신 게임방 목록을 불러왔습니다",
    });
  };

  // 나머지 UI 코드는 기존과 동일하되, 
  // 목업 데이터 대신 실제 API 데이터 사용
  
  return (
    <div className="space-y-6">
      {/* 기존 UI 코드 유지 */}
      {/* gameRooms 배열은 이제 API에서 가져온 실제 데이터 */}
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && gameRooms.length === 0 ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">로딩 중...</span>
          </div>
        ) : gameRooms.length === 0 ? (
          <div className="col-span-full">
            {/* 빈 상태 UI */}
          </div>
        ) : (
          gameRooms.map((room) => (
            <div key={room.gameNumber} /* 게임방 카드 UI */>
              {/* 기존 게임방 카드 코드, 이제 실제 데이터 표시 */}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 5. 테스트 파일

**파일**: `src/services/__tests__/gameService.test.ts`

```typescript
import { gameService } from '../gameService';
import { apiService } from '../api';

jest.mock('../api');

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create game successfully', async () => {
    const mockGameNumber = 123;
    const gameConfig = {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: 'LIARS_KNOW' as const,
      subjectIds: [1, 2, 3],
      useRandomSubjects: true,
      randomSubjectCount: 2,
      targetPoints: 10,
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockGameNumber);

    const result = await gameService.createGame(gameConfig);

    expect(result).toBe(mockGameNumber);
    expect(apiService.post).toHaveBeenCalledWith('/game/create', gameConfig);
  });

  it('should join game successfully', async () => {
    const mockGameState = {
      gameNumber: 123,
      gameOwner: 'testHost',
      players: [],
      gameState: 'WAITING',
    };

    (apiService.post as jest.Mock).mockResolvedValue(mockGameState);

    const result = await gameService.joinGame({ gameNumber: 123 });

    expect(result).toEqual(mockGameState);
    expect(apiService.post).toHaveBeenCalledWith('/game/join', { gameNumber: 123 });
  });

  it('should fetch active rooms', async () => {
    const mockRooms = {
      gameRooms: [
        { gameNumber: 123, gameOwner: 'host1', gameState: 'WAITING' },
        { gameNumber: 456, gameOwner: 'host2', gameState: 'IN_PROGRESS' },
      ]
    };

    (apiService.get as jest.Mock).mockResolvedValue(mockRooms);

    const result = await gameService.getActiveRooms();

    expect(result).toEqual(mockRooms);
    expect(apiService.get).toHaveBeenCalledWith('/game/rooms');
  });
});
```

## 검증 체크리스트

### ✅ 파일 생성/수정 확인
- [ ] `src/types/game.ts` (수정)
- [ ] `src/services/gameService.ts` (신규)
- [ ] `src/store/gameStore.ts` (수정)
- [ ] `src/components/lobby/GameRoomsSection.tsx` (수정)
- [ ] `src/services/__tests__/gameService.test.ts` (신규)

### ✅ 기능 테스트

1. **게임방 목록 조회**
   - 빈 목록 표시
   - 활성 게임방 표시
   - 새로고침 기능

2. **게임방 생성**
   - 올바른 설정으로 생성
   - 필수 필드 검증
   - 생성 후 자동 이동

3. **게임방 참여**
   - 유효한 게임방 참여
   - 가득 찬 방 참여 시도
   - 존재하지 않는 방 참여 시도

4. **게임방 나가기**
   - 정상적인 나가기
   - 호스트 나가기 시 처리

## 성공 기준

Phase 3가 성공적으로 완료되면:
- ✅ 실제 게임방 목록을 API에서 가져옴
- ✅ 게임방 생성이 백엔드와 연동됨
- ✅ 게임방 참여/나가기가 정상 동작함
- ✅ 게임 상태가 실시간으로 동기화됨
- ✅ 오류 처리가 적절히 동작함

다음 단계 (Phase 4: WebSocket Real-time Communication)를 진행할 수 있습니다.