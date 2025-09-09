# Phase 5: Game Flow Implementation

## 목표
게임 시작부터 종료까지의 전체 플로우를 백엔드 API와 연동하여 구현합니다. 힌트 제공, 투표, 변론, 결과 처리 등 핵심 게임 로직을 완성합니다.

## 전제 조건
- Phase 1-4 모든 단계 완료
- WebSocket 실시간 통신 정상 동작
- 백엔드 게임 플레이 API 정상 동작

## 주요 작업

### 1. 게임 플로우 관련 타입 확장

**파일**: `src/types/gameFlow.ts`

```typescript
// 힌트 제출 응답
export interface HintSubmissionResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  currentTurnIndex: number;
  currentPlayerId: number;
  success: boolean;
}

// 최종 투표 응답
export interface FinalVoteResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  accusedPlayer: {
    id: number;
    nickname: string;
    isExecuted: boolean;
  };
  success: boolean;
}

// 게임 결과
export interface GameResult {
  gameNumber: number;
  winningTeam: 'CITIZENS' | 'LIARS';
  players: {
    id: number;
    nickname: string;
    role: 'CITIZEN' | 'LIAR';
    isAlive: boolean;
    isWinner: boolean;
    score: number;
  }[];
  gameStatistics: {
    totalRounds: number;
    currentRound: number;
    totalDuration: number;
    averageRoundDuration: number;
  };
  reason: string;
}

// 라운드 종료 응답
export interface RoundEndResponse {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  gameCurrentRound: number;
  scoreboard: {
    userId: number;
    nickname: string;
    isAlive: boolean;
    score: number;
  }[];
  success: boolean;
}
```

### 2. 게임 플로우 서비스 확장

**파일**: `src/services/gameFlowService.ts`

```typescript
import { apiService } from './api';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import {
  HintSubmissionResponse,
  VoteResponse,
  DefenseResponse,
  FinalVoteResponse,
  GuessResponse,
  GameResult,
  RoundEndResponse,
} from '../types/gameFlow';

export class GameFlowService {
  // 힌트 제출
  async submitHint(gameNumber: number, hint: string): Promise<HintSubmissionResponse> {
    try {
      console.log('Submitting hint:', { gameNumber, hint });
      const response = await apiService.post<HintSubmissionResponse>(
        API_ENDPOINTS.GAME_PLAY.HINT,
        { gameNumber, hint }
      );
      console.log('Hint submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit hint:', error);
      throw error;
    }
  }

  // 라이어 투표
  async castVoteForLiar(gameNumber: number, targetUserId: number): Promise<VoteResponse> {
    try {
      console.log('Casting vote for liar:', { gameNumber, targetUserId });
      const response = await apiService.post<VoteResponse>(
        API_ENDPOINTS.GAME_PLAY.VOTE,
        { gameNumber, targetUserId }
      );
      console.log('Vote cast successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to cast vote:', error);
      throw error;
    }
  }

  // 변론 제출
  async submitDefense(gameNumber: number, defenseText: string): Promise<DefenseResponse> {
    try {
      console.log('Submitting defense:', { gameNumber, defenseText });
      const response = await apiService.post<DefenseResponse>(
        API_ENDPOINTS.GAME_PLAY.DEFENSE,
        { gameNumber, defenseText }
      );
      console.log('Defense submitted successfully');
      return response;
    } catch (error) {
      console.error('Failed to submit defense:', error);
      throw error;
    }
  }

  // 변론 즉시 종료
  async endDefensePhase(gameNumber: number): Promise<any> {
    try {
      console.log('Ending defense phase:', gameNumber);
      const response = await apiService.post(
        API_ENDPOINTS.GAME_PLAY.END_DEFENSE,
        { gameNumber }
      );
      console.log('Defense phase ended successfully');
      return response;
    } catch (error) {
      console.error('Failed to end defense phase:', error);
      throw error;
    }
  }

  // 최종 투표 (처형/생존)
  async castFinalVote(gameNumber: number, voteForExecution: boolean): Promise<FinalVoteResponse> {
    try {
      console.log('Casting final vote:', { gameNumber, voteForExecution });
      const response = await apiService.post<FinalVoteResponse>(
        API_ENDPOINTS.GAME_PLAY.FINAL_VOTE,
        { gameNumber, voteForExecution }
      );
      console.log('Final vote cast successfully');
      return response;
    } catch (error) {
      console.error('Failed to cast final vote:', error);
      throw error;
    }
  }

  // 라이어의 단어 추측
  async guessWord(gameNumber: number, guess: string): Promise<GuessResponse> {
    try {
      console.log('Guessing word:', { gameNumber, guess });
      const response = await apiService.post<GuessResponse>(
        API_ENDPOINTS.GAME_PLAY.GUESS_WORD,
        { gameNumber, guess }
      );
      console.log('Word guess submitted:', response);
      return response;
    } catch (error) {
      console.error('Failed to guess word:', error);
      throw error;
    }
  }

  // 라운드 종료 처리
  async endRound(gameNumber: number): Promise<RoundEndResponse> {
    try {
      console.log('Ending round:', gameNumber);
      const response = await apiService.post<RoundEndResponse>(
        API_ENDPOINTS.GAME_PLAY.END_ROUND,
        { gameNumber }
      );
      console.log('Round ended successfully');
      return response;
    } catch (error) {
      console.error('Failed to end round:', error);
      throw error;
    }
  }

  // 게임 결과 조회
  async getGameResult(gameNumber: number): Promise<GameResult> {
    try {
      const response = await apiService.get<GameResult>(
        `${API_ENDPOINTS.GAME.RESULT}/${gameNumber}`
      );
      console.log('Game result fetched:', response);
      return response;
    } catch (error) {
      console.error('Failed to get game result:', error);
      throw error;
    }
  }
}

export const gameFlowService = new GameFlowService();
```

### 3. 게임 플로우 Hook 구현

**파일**: `src/hooks/useGameFlow.ts`

```typescript
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useToast } from './useToast';
import { gameFlowService } from '../services/gameFlowService';
import { websocketService } from '../services/websocketService';

export function useGameFlow() {
  const gameStore = useGameStore();
  const { toast } = useToast();

  // 힌트 제출
  const submitHint = useCallback(async (hint: string) => {
    const { gameNumber, currentPlayer } = gameStore;
    if (!gameNumber || !currentPlayer) return;

    try {
      gameStore.setLoading(true);
      
      const response = await gameFlowService.submitHint(gameNumber, hint);
      
      // 게임 상태 업데이트
      gameStore.setGamePhase(response.currentPhase as any);
      gameStore.setCurrentTurnPlayer(response.currentPlayerId.toString());
      
      toast({
        title: "힌트 제출 완료",
        description: "다음 플레이어를 기다리고 있습니다",
      });
      
    } catch (error: any) {
      toast({
        title: "힌트 제출 실패",
        description: error.message || "힌트 제출 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 라이어 투표
  const voteForLiar = useCallback(async (targetUserId: number) => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    try {
      gameStore.setLoading(true);
      
      const response = await gameFlowService.castVoteForLiar(gameNumber, targetUserId);
      
      if (response.isSuccessful) {
        gameStore.setUserVote(targetUserId.toString());
        
        toast({
          title: "투표 완료",
          description: "투표가 성공적으로 처리되었습니다",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "투표 실패",
        description: error.message || "투표 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 변론 제출
  const submitDefense = useCallback(async (defenseText: string) => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    try {
      gameStore.setLoading(true);
      
      const response = await gameFlowService.submitDefense(gameNumber, defenseText);
      
      if (response.success) {
        toast({
          title: "변론 제출 완료",
          description: "변론이 성공적으로 제출되었습니다",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "변론 제출 실패",
        description: error.message || "변론 제출 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 변론 즉시 종료
  const endDefense = useCallback(async () => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    try {
      gameStore.setLoading(true);
      
      await gameFlowService.endDefensePhase(gameNumber);
      
      toast({
        title: "변론 종료",
        description: "변론이 종료되었습니다. 최종 투표를 진행합니다",
      });
      
    } catch (error: any) {
      toast({
        title: "변론 종료 실패",
        description: error.message || "변론 종료 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 최종 투표
  const castFinalVote = useCallback(async (voteForExecution: boolean) => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    try {
      gameStore.setLoading(true);
      
      const response = await gameFlowService.castFinalVote(gameNumber, voteForExecution);
      
      if (response.success) {
        toast({
          title: "최종 투표 완료",
          description: voteForExecution ? "처형에 찬성했습니다" : "생존에 찬성했습니다",
        });
      }
      
    } catch (error: any) {
      toast({
        title: "최종 투표 실패",
        description: error.message || "최종 투표 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 단어 추측
  const guessWord = useCallback(async (guess: string) => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    try {
      gameStore.setLoading(true);
      
      const response = await gameFlowService.guessWord(gameNumber, guess);
      
      toast({
        title: response.isCorrect ? "정답입니다!" : "오답입니다",
        description: response.isCorrect 
          ? `라이어 승리! 정답: ${response.actualWord}`
          : `시민 승리! 정답은 "${response.actualWord}"였습니다`,
      });
      
    } catch (error: any) {
      toast({
        title: "단어 추측 실패",
        description: error.message || "단어 추측 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      gameStore.setLoading(false);
    }
  }, [gameStore, toast]);

  // 채팅 메시지 전송
  const sendChatMessage = useCallback((content: string, type: string = 'DISCUSSION') => {
    const { gameNumber } = gameStore;
    if (!gameNumber) return;

    const success = websocketService.sendChatMessage(gameNumber, content, type);
    
    if (!success) {
      toast({
        title: "메시지 전송 실패",
        description: "서버와의 연결을 확인해주세요",
        variant: "destructive",
      });
    }
  }, [gameStore, toast]);

  return {
    submitHint,
    voteForLiar,
    submitDefense,
    endDefense,
    castFinalVote,
    guessWord,
    sendChatMessage,
  };
}
```

### 4. 게임 단계별 컴포넌트 수정

#### 4.1 힌트 제공 단계 컴포넌트

**파일**: `src/components/game/HintPhase.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';

export function HintPhase() {
  const [hint, setHint] = useState('');
  const gameStore = useGameStore();
  const { submitHint } = useGameFlow();

  const {
    currentPlayer,
    currentTurnPlayerId,
    currentTopic,
    currentWord,
    players,
    isLoading,
  } = gameStore;

  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId);

  const handleSubmitHint = async () => {
    if (!hint.trim()) return;

    await submitHint(hint.trim());
    setHint('');
  };

  return (
    <div className="space-y-6">
      {/* 현재 상황 표시 */}
      <Card>
        <CardHeader>
          <CardTitle>힌트 제공 단계</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">현재 주제</div>
            <div className="text-lg font-semibold">{currentTopic}</div>
          </div>
          
          {currentWord && (
            <div>
              <div className="text-sm text-gray-600 mb-2">당신의 단어</div>
              <div className="text-lg font-semibold text-blue-600">{currentWord}</div>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-600 mb-2">현재 턴</div>
            <div className="text-lg font-semibold">
              {currentTurnPlayer?.nickname || '알 수 없음'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 힌트 입력 (내 턴일 때만) */}
      {isMyTurn && (
        <Card>
          <CardHeader>
            <CardTitle>힌트를 입력하세요</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="주제에 대한 힌트를 입력하세요..."
              rows={3}
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmitHint}
              disabled={!hint.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? '제출 중...' : '힌트 제출'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 대기 중 표시 */}
      {!isMyTurn && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                {currentTurnPlayer?.nickname}님의 힌트를 기다리고 있습니다
              </div>
              <div className="text-gray-600">잠시만 기다려주세요...</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이미 제출한 힌트들 표시 */}
      <Card>
        <CardHeader>
          <CardTitle>제출된 힌트들</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players.filter(p => p.hint).map((player) => (
              <div key={player.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <span className="font-medium">{player.nickname}:</span>
                <span>{player.hint}</span>
              </div>
            ))}
            {players.filter(p => p.hint).length === 0 && (
              <div className="text-gray-500 text-center py-4">
                아직 제출된 힌트가 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.2 투표 단계 컴포넌트

**파일**: `src/components/game/VotingPhase.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';

export function VotingPhase() {
  const gameStore = useGameStore();
  const { voteForLiar } = useGameFlow();

  const { players, currentPlayer, userVote, isLoading } = gameStore;

  const handleVote = async (targetUserId: string) => {
    await voteForLiar(parseInt(targetUserId));
  };

  const hasVoted = !!userVote;
  const alivePlayers = players.filter(p => p.isAlive && p.id !== currentPlayer?.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>라이어 투표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-600 mb-4">
            라이어라고 생각하는 플레이어에게 투표하세요
          </div>
          
          {hasVoted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-800 font-semibold">투표 완료</div>
              <div className="text-green-600">다른 플레이어들의 투표를 기다리고 있습니다</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {alivePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{player.nickname}</div>
                    {player.hint && (
                      <div className="text-sm text-gray-600">
                        힌트: "{player.hint}"
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleVote(player.id)}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? '투표 중...' : '투표'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 투표 현황 표시 */}
      <Card>
        <CardHeader>
          <CardTitle>투표 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <span>{player.nickname}</span>
                <span className={player.hasVoted ? 'text-green-600' : 'text-gray-400'}>
                  {player.hasVoted ? '✓ 투표완료' : '대기중'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.3 변론 단계 컴포넌트

**파일**: `src/components/game/DefensePhase.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameStore } from '@/store/gameStore';
import { useGameFlow } from '@/hooks/useGameFlow';

export function DefensePhase() {
  const [defenseText, setDefenseText] = useState('');
  const gameStore = useGameStore();
  const { submitDefense, endDefense } = useGameFlow();

  const { 
    players, 
    currentPlayer,
    voting,
    isLoading,
  } = gameStore;

  // 가장 많은 표를 받은 플레이어 (지목된 플레이어)
  const accusedPlayer = players.find(p => p.id === voting.targetPlayerId);
  const isAccused = currentPlayer?.id === accusedPlayer?.id;

  const handleSubmitDefense = async () => {
    if (!defenseText.trim()) return;
    await submitDefense(defenseText.trim());
    setDefenseText('');
  };

  const handleEndDefense = async () => {
    await endDefense();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>변론 단계</CardTitle>
        </CardHeader>
        <CardContent>
          {accusedPlayer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="font-semibold text-yellow-800">
                {accusedPlayer.nickname}님이 라이어로 지목되었습니다
              </div>
              <div className="text-yellow-600">
                변론을 들어보겠습니다
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 변론 입력 (지목된 플레이어만) */}
      {isAccused && (
        <Card>
          <CardHeader>
            <CardTitle>변론하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={defenseText}
              onChange={(e) => setDefenseText(e.target.value)}
              placeholder="당신의 변론을 입력하세요..."
              rows={4}
              disabled={isLoading}
            />
            <div className="flex space-x-2">
              <Button
                onClick={handleSubmitDefense}
                disabled={!defenseText.trim() || isLoading}
                className="flex-1"
              >
                {isLoading ? '제출 중...' : '변론 제출'}
              </Button>
              <Button
                onClick={handleEndDefense}
                disabled={isLoading}
                variant="outline"
              >
                변론 종료
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 변론 내용 표시 */}
      {accusedPlayer?.defense && (
        <Card>
          <CardHeader>
            <CardTitle>{accusedPlayer.nickname}님의 변론</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{accusedPlayer.defense}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 대기 메시지 */}
      {!isAccused && !accusedPlayer?.defense && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <div className="text-lg font-semibold mb-2">
                {accusedPlayer?.nickname}님의 변론을 기다리고 있습니다
              </div>
              <div className="text-gray-600">잠시만 기다려주세요...</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### 5. 게임 페이지 통합

**파일**: `src/versions/main/pages/GamePage.tsx` (수정)

```typescript
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { HintPhase } from '@/components/game/HintPhase';
import { VotingPhase } from '@/components/game/VotingPhase';
import { DefensePhase } from '@/components/game/DefensePhase';
// ... 기타 imports

export default function GamePage() {
  const { gameNumber: gameNumberParam } = useParams<{ gameNumber: string }>();
  const gameNumber = gameNumberParam ? parseInt(gameNumberParam) : null;
  
  const gameStore = useGameStore();
  const { isConnected, connectionState } = useWebSocket(gameNumber);

  const { gamePhase, isLoading } = gameStore;

  useEffect(() => {
    if (gameNumber && !gameStore.gameNumber) {
      gameStore.joinGameById(gameNumber).catch(error => {
        console.error('Failed to join game:', error);
      });
    }
  }, [gameNumber, gameStore]);

  // 게임 단계에 따른 컴포넌트 렌더링
  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return <div>플레이어 대기 중...</div>;
      
      case 'SPEECH':
        return <HintPhase />;
      
      case 'VOTING_FOR_LIAR':
        return <VotingPhase />;
      
      case 'DEFENDING':
        return <DefensePhase />;
      
      case 'VOTING_FOR_SURVIVAL':
        return <div>최종 투표 단계</div>; // 추가 구현 필요
      
      case 'GUESSING_WORD':
        return <div>단어 추측 단계</div>; // 추가 구현 필요
      
      case 'GAME_OVER':
        return <div>게임 종료</div>; // 결과 표시
      
      default:
        return <div>알 수 없는 게임 상태</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 게임 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold">게임방 {gameNumber}</h1>
              <div className="text-sm text-gray-600">
                {gamePhase && `현재 단계: ${gamePhase}`}
              </div>
            </div>
            <div className={`text-sm font-medium ${
              connectionState === 'connected' ? 'text-green-500' : 'text-red-500'
            }`}>
              ● {isConnected ? '연결됨' : '연결 끊김'}
            </div>
          </div>
        </div>
      </div>

      {/* 게임 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 게임 영역 */}
          <div className="lg:col-span-2">
            {renderGamePhase()}
          </div>
          
          {/* 사이드바 (플레이어 목록, 채팅 등) */}
          <div className="space-y-6">
            {/* 플레이어 목록, 채팅박스 등 */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 검증 체크리스트

### ✅ 파일 생성/수정 확인
- [ ] `src/types/gameFlow.ts` (신규)
- [ ] `src/services/gameFlowService.ts` (신규)
- [ ] `src/hooks/useGameFlow.ts` (신규)
- [ ] `src/components/game/HintPhase.tsx` (신규)
- [ ] `src/components/game/VotingPhase.tsx` (신규)
- [ ] `src/components/game/DefensePhase.tsx` (신규)
- [ ] `src/versions/main/pages/GamePage.tsx` (수정)

### ✅ 기능 테스트

1. **게임 시작부터 종료까지 전체 플로우**
   - 게임 시작 → 힌트 제공 → 투표 → 변론 → 최종 투표 → 결과

2. **각 단계별 기능**
   - 힌트 제출 및 턴 넘김
   - 투표 시스템 동작
   - 변론 제출 및 즉시 종료
   - 최종 투표 처리

3. **실시간 동기화**
   - 다른 플레이어 액션 실시간 반영
   - 게임 상태 변경 실시간 업데이트

## 성공 기준

Phase 5가 성공적으로 완료되면:
- ✅ 게임 시작부터 종료까지 완전한 플로우 동작
- ✅ 모든 게임 단계가 백엔드와 연동됨
- ✅ 실시간 상태 동기화 완벽 동작
- ✅ 사용자 액션이 모두 정상 처리됨
- ✅ 오류 상황에 대한 적절한 처리

다음 단계 (Phase 6: Advanced Features & Testing)를 진행할 수 있습니다.