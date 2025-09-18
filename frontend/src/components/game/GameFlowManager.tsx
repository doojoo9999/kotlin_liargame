import React, {useEffect, useState} from 'react';
import {useGameStore} from '@/stores';
import {websocketService} from '@/services/websocketService';
import {GameResults} from './GameResults';
import {GameChat} from './GameChat';
import {ModeratorCommentary} from './ModeratorCommentary';
import {GamePhaseIndicator} from './GamePhaseIndicator';
import {PlayerStatusPanel} from './PlayerStatusPanel';
import {GameActionInterface} from './GameActionInterface';
import {ActivityFeed} from './ActivityFeed';
import {Card, CardContent} from '@/components/ui/card';
import {AlertCircle} from 'lucide-react';

interface GameFlowManagerProps {
  onReturnToLobby?: () => void;
  onNextRound?: () => void;
}

export const GameFlowManager: React.FC<GameFlowManagerProps> = ({
  onReturnToLobby,
  onNextRound,
}) => {
  const {
    gameNumber,
    gamePhase,
    currentPlayer,
    players,
    currentTopic,
    currentWord,
    currentLiar,
    currentTurnPlayerId,
    timer,
    voting,
    isLoading,
    error,
    isLiar,
    addHint,
    castVote,
    addDefense,
  } = useGameStore();

  // Activity log state
  const [activities, setActivities] = useState<any[]>([]);
  const [currentRound] = useState(1);
  const [totalRounds] = useState(3);

  // WebSocket 연결 및 게임 이벤트 구독
  useEffect(() => {
    if (gameNumber) {
      const gameId = gameNumber.toString();

      // WebSocket 연결
      websocketService.connect().then(() => {
        websocketService.subscribeToGame(gameId);
      }).catch(console.error);

      // 게임 상태 업데이트 구독
      const unsubscribeGameState = websocketService.onGameStateUpdate((event) => {
        console.log('Game state updated:', event);
        // 게임 스토어가 자동으로 상태를 업데이트합니다
      });

      // 단계 변경 구독
      const unsubscribePhase = websocketService.onPhaseChanged((event) => {
        console.log('Phase changed:', event);
      });

      // 타이머 업데이트 구독
      const unsubscribeTimer = websocketService.onTimerUpdate((event) => {
        console.log('Timer updated:', event);
      });

      // 라운드 종료 구독
      const unsubscribeRoundEnd = websocketService.onRoundEnded((event) => {
        console.log('Round ended:', event);
      });

      // 게임 종료 구독
      const unsubscribeGameEnd = websocketService.onGameEnded((event) => {
        console.log('Game ended:', event);
      });

      // 정리 함수
      return () => {
        unsubscribeGameState();
        unsubscribePhase();
        unsubscribeTimer();
        unsubscribeRoundEnd();
        unsubscribeGameEnd();
        websocketService.unsubscribeFromGame(gameId);
      };
    }
  }, [gameNumber]);

  // Add phase change activity when phase changes
  useEffect(() => {
    if (gamePhase) {
      setActivities(prev => [{
        id: `phase-${Date.now()}`,
        type: 'phase_change' as const,
        timestamp: Date.now(),
        phase: gamePhase,
        isHighlight: true
      }, ...prev]);
    }
  }, [gamePhase]);

  // Utility functions
  const isMyTurn = () => {
    return currentTurnPlayerId === currentPlayer?.id;
  };

  const canVote = () => {
    return Boolean(currentPlayer && !voting.votes[currentPlayer.id]);
  };

  const handleSubmitHint = React.useCallback(async (hint: string) => {
    if (currentPlayer && gameNumber) {
      try {
        // Add hint via store function
        addHint(currentPlayer.id, currentPlayer.nickname, hint);

        // Send to server via websocket if available
        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'hint', { hint });
        }
      } catch (error) {
        console.error('Failed to submit hint:', error);
      }
    }
  }, [addHint, currentPlayer, gameNumber]);

  const handleVotePlayer = React.useCallback(async (playerId: string) => {
    if (currentPlayer && gameNumber) {
      try {
        const targetPlayer = players.find(p => p.id === playerId);
        if (targetPlayer) {
          castVote(currentPlayer.id, playerId);
        }
      } catch (error) {
        console.error('Failed to vote:', error);
      }
    }
  }, [castVote, currentPlayer, gameNumber, players]);

  const handleSubmitDefense = React.useCallback(async (defense: string) => {
    if (currentPlayer && gameNumber) {
      try {
        addDefense(currentPlayer.id, currentPlayer.nickname, defense);

        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'defense', { defense });
        }
      } catch (error) {
        console.error('Failed to submit defense:', error);
      }
    }
  }, [addDefense, currentPlayer, gameNumber]);

  const handleGuessWord = React.useCallback(async (guess: string) => {
    if (currentPlayer && gameNumber) {
      try {
        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'guess', { guess });
        }
      } catch (error) {
        console.error('Failed to guess word:', error);
      }
    }
  }, [currentPlayer, gameNumber]);

  const handleCastFinalVote = React.useCallback(async (execute: boolean) => {
    if (currentPlayer && gameNumber) {
      try {
        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'final_vote', { execute });
        }
      } catch (error) {
        console.error('Failed to cast final vote:', error);
      }
    }
  }, [currentPlayer, gameNumber]);


  const suspectedPlayer = players.find(player => player.id === currentLiar) || null;
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !gameNumber) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">게임을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="space-y-6">
        {/* Moderator Commentary - Prominent Position */}
        <ModeratorCommentary
          gamePhase={gamePhase}
          currentTopic={currentTopic ?? null}
          currentWord={currentWord ?? null}
          timeRemaining={timer.timeRemaining ?? 0}
          isLiar={Boolean(isLiar)}
          playerCount={players.length}
          suspectedPlayer={suspectedPlayer?.nickname}
        />

        {/* Game Phase Indicator */}
        <GamePhaseIndicator
          phase={gamePhase}
          timeRemaining={timer.timeRemaining ?? 0}
        />

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Player Status */}
          <div className="xl:col-span-1">
            <PlayerStatusPanel
              players={players}
              currentPhase={gamePhase}
              currentPlayer={currentPlayer ?? null}
              currentTurnPlayerId={currentTurnPlayerId ?? null}
              votes={voting.votes}
              isLiar={Boolean(isLiar)}
              suspectedPlayer={suspectedPlayer?.id}
            />
          </div>

          {/* Main Game Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Game Action Interface */}
            <GameActionInterface
              gamePhase={gamePhase}
              currentPlayer={currentPlayer ?? null}
              isMyTurn={isMyTurn()}
              isLiar={Boolean(isLiar)}
              canVote={canVote()}
              timeRemaining={timer.timeRemaining ?? 0}
              onSubmitHint={handleSubmitHint}
              onVotePlayer={handleVotePlayer}
              onSubmitDefense={handleSubmitDefense}
              onGuessWord={handleGuessWord}
              onCastFinalVote={handleCastFinalVote}
              players={players}
              suspectedPlayer={suspectedPlayer ?? undefined}
              currentTopic={currentTopic ?? undefined}
              currentWord={currentWord ?? undefined}
            />

            {/* Legacy Game Phase Components (for fallback) */}
            {gamePhase === 'GAME_OVER' && (
              <GameResults
                currentRound={currentRound}
                totalRounds={totalRounds}
                onNextRound={onNextRound}
                onReturnToLobby={onReturnToLobby}
              />
            )}
          </div>

          {/* Right Sidebar - Activity & Chat */}
          <div className="xl:col-span-1 space-y-6">
            <ActivityFeed
              events={activities}
            />
            
            <GameChat
              players={players}
              currentPlayer={currentPlayer ?? null}
              gamePhase={gamePhase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

