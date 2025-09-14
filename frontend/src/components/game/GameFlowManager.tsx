import React, {useEffect, useState} from 'react';
import {useGameStore} from '@/stores';
import {websocketService} from '@/services/websocketService';
import {HintPhase} from './HintPhase';
import {VotingPhase} from './VotingPhase';
import {DefensePhase} from './DefensePhase';
import {GuessPhase} from './GuessPhase';
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

  // 에러 상태 처리
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

  // 로딩 상태 처리
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

  // Phase info helper function
  const getPhaseInfo = (phase: string) => {
    switch (phase) {
      case 'WAITING_FOR_PLAYERS':
        return { icon: '⏳', text: '플레이어 대기 중', color: 'text-gray-500' };
      case 'SPEECH':
        return { icon: '💭', text: '힌트 제공', color: 'text-green-500' };
      case 'VOTING_FOR_LIAR':
        return { icon: '🗳️', text: '라이어 투표', color: 'text-orange-500' };
      case 'DEFENDING':
        return { icon: '🛡️', text: '변론 시간', color: 'text-purple-500' };
      case 'VOTING_FOR_SURVIVAL':
        return { icon: '⚖️', text: '생존 투표', color: 'text-red-500' };
      case 'GUESSING_WORD':
        return { icon: '🔍', text: '단어 맞추기', color: 'text-blue-500' };
      case 'GAME_OVER':
        return { icon: '🏆', text: '게임 종료', color: 'text-yellow-500' };
      default:
        return { icon: '❓', text: phase, color: 'text-gray-500' };
    }
  };

  const phaseInfo = getPhaseInfo(gamePhase || '');
  const suspectedPlayer = players.find(p => p.id === currentLiar) || null;
  const liarPlayer = players.find(p => p.role === 'liar') || null;

  // Utility functions
  const isMyTurn = () => {
    return currentTurnPlayerId === currentPlayer?.id;
  };

  const canVote = () => {
    return currentPlayer && !voting.votes[currentPlayer.id];
  };

  const submitHint = async (hint: string) => {
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
  };

  const voteForLiar = async (playerId: number) => {
    if (currentPlayer && gameNumber) {
      try {
        const targetPlayer = players.find(p => p.id === playerId.toString());
        if (targetPlayer) {
          castVote(playerId.toString());
        }
      } catch (error) {
        console.error('Failed to vote:', error);
      }
    }
  };

  const submitDefense = async (defense: string) => {
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
  };

  const guessWord = async (guess: string) => {
    if (currentPlayer && gameNumber) {
      try {
        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'guess', { guess });
        }
      } catch (error) {
        console.error('Failed to guess word:', error);
      }
    }
  };

  const castFinalVote = async (execute: boolean) => {
    if (currentPlayer && gameNumber) {
      try {
        if (websocketService) {
          await websocketService.sendGameAction(gameNumber.toString(), 'final_vote', { execute });
        }
      } catch (error) {
        console.error('Failed to cast final vote:', error);
      }
    }
  };

  // 게임 단계별 렌더링
  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'WAITING_FOR_PLAYERS':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-lg font-medium mb-2">게임 시작 대기 중</div>
                <div className="text-muted-foreground">
                  모든 플레이어가 준비되면 게임이 시작됩니다.
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'SPEECH':
        return (
          <HintPhase
            currentTopic={currentTopic}
            currentWord={currentWord}
            isMyTurn={isMyTurn() ?? false}
            isLiar={isLiar ?? false}
            timeRemaining={timer.timeRemaining}
          />
        );

      case 'VOTING_FOR_LIAR':
        return (
          <VotingPhase
            players={players}
            currentPlayer={currentPlayer}
            votingPhase="LIAR_VOTE"
            votes={voting.votes}
            timeRemaining={timer.timeRemaining}
            canVote={canVote()}
          />
        );

      case 'DEFENDING':
        return (
          <DefensePhase
            suspectedPlayer={suspectedPlayer}
            currentPlayer={currentPlayer}
            timeRemaining={timer.timeRemaining}
            isDefending={currentLiar === currentPlayer?.id}
            canEndDefense={!!currentPlayer?.isHost || currentLiar === currentPlayer?.id}
          />
        );

      case 'VOTING_FOR_SURVIVAL':
        return (
          <VotingPhase
            players={players}
            currentPlayer={currentPlayer}
            votingPhase="SURVIVAL_VOTE"
            targetPlayerId={currentLiar || undefined}
            votes={voting.votes}
            timeRemaining={timer.timeRemaining}
            canVote={canVote()}
          />
        );

      case 'GUESSING_WORD':
        return (
          <GuessPhase
            currentTopic={currentTopic}
            liarPlayer={liarPlayer}
            currentPlayer={currentPlayer}
            timeRemaining={timer.timeRemaining}
            isLiar={isLiar}
            hints={[]} // 힌트 목록은 게임 스토어에서 관리하도록 확장 필요
          />
        );

      case 'GAME_OVER':
        return (
          <GameResults
            players={players}
            currentRound={1} // 현재 라운드 정보 추가 필요
            totalRounds={3} // 총 라운드 정보 추가 필요
            onNextRound={onNextRound}
            onReturnToLobby={onReturnToLobby}
          />
        );

      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-lg font-medium mb-2">알 수 없는 게임 단계</div>
                <div className="text-muted-foreground">
                  현재 게임 단계: {gamePhase}
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  // Action handlers for GameActionInterface
  const handleSubmitHint = async (hint: string) => {
    await submitHint(hint);
    // Add activity log
    setActivities(prev => [{
      id: Date.now().toString(),
      type: 'hint' as const,
      playerId: currentPlayer?.id,
      playerName: currentPlayer?.nickname,
      content: hint,
      timestamp: Date.now(),
      phase: gamePhase
    }, ...prev]);
  };

  const handleVotePlayer = async (playerId: string) => {
    await voteForLiar(parseInt(playerId));
    const targetPlayer = players.find(p => p.id === playerId);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: 'vote' as const,
      playerId: currentPlayer?.id,
      playerName: currentPlayer?.nickname,
      targetId: playerId,
      targetName: targetPlayer?.nickname,
      timestamp: Date.now(),
      phase: gamePhase
    }, ...prev]);
  };

  const handleSubmitDefense = async (defense: string) => {
    await submitDefense(defense);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: 'defense' as const,
      playerId: currentPlayer?.id,
      playerName: currentPlayer?.nickname,
      content: defense,
      timestamp: Date.now(),
      phase: gamePhase
    }, ...prev]);
  };

  const handleGuessWord = async (guess: string) => {
    await guessWord(guess);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: 'guess' as const,
      playerId: currentPlayer?.id,
      playerName: currentPlayer?.nickname,
      content: guess,
      timestamp: Date.now(),
      phase: gamePhase
    }, ...prev]);
  };

  const handleCastFinalVote = async (execute: boolean) => {
    await castFinalVote(execute);
    setActivities(prev => [{
      id: Date.now().toString(),
      type: 'vote' as const,
      playerId: currentPlayer?.id,
      playerName: currentPlayer?.nickname,
      content: execute ? '처형 투표' : '생존 투표',
      timestamp: Date.now(),
      phase: gamePhase
    }, ...prev]);
  };

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

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="space-y-6">
        {/* Moderator Commentary - Prominent Position */}
        <ModeratorCommentary
          gamePhase={gamePhase}
          currentTopic={currentTopic}
          currentWord={currentWord}
          timeRemaining={timer.timeRemaining}
          isLiar={isLiar ?? false}
          playerCount={players.length}
          currentTurnPlayer={players.find(p => p.id === currentTurnPlayerId)?.nickname}
          suspectedPlayer={players.find(p => p.id === currentLiar)?.nickname}
        />

        {/* Game Phase Indicator */}
        <GamePhaseIndicator
          gamePhase={gamePhase}
          timeRemaining={timer.timeRemaining}
          maxTime={timer.maxTime || 0}
          currentRound={currentRound}
          totalRounds={totalRounds}
          playerCount={players.length}
          readyCount={players.filter(p => p.isReady).length}
          votedCount={Object.keys(voting.votes).length}
        />

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Player Status */}
          <div className="xl:col-span-1">
            <PlayerStatusPanel
              players={players}
              currentPlayer={currentPlayer}
              gamePhase={gamePhase}
              currentTurnPlayerId={currentTurnPlayerId}
              votes={voting.votes}
              isLiar={isLiar ?? false}
              suspectedPlayer={currentLiar}
            />
          </div>

          {/* Main Game Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Game Action Interface */}
            <GameActionInterface
              gamePhase={gamePhase}
              currentPlayer={currentPlayer}
              isMyTurn={isMyTurn() ?? false}
              isLiar={isLiar ?? false}
              canVote={canVote()}
              timeRemaining={timer.timeRemaining}
              onSubmitHint={handleSubmitHint}
              onVotePlayer={handleVotePlayer}
              onSubmitDefense={handleSubmitDefense}
              onGuessWord={handleGuessWord}
              onCastFinalVote={handleCastFinalVote}
              players={players}
              suspectedPlayer={players.find(p => p.id === currentLiar)}
              currentTopic={currentTopic}
              currentWord={currentWord}
            />

            {/* Legacy Game Phase Components (for fallback) */}
            {gamePhase === 'GAME_OVER' && (
              <GameResults
                players={players}
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
              currentPlayer={currentPlayer}
              gamePhase={gamePhase}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
