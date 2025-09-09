import React, {useEffect} from 'react';
import {useGameFlow} from '@/hooks/useGameFlow';
import {websocketService} from '@/services/websocketService';
import {HintPhase} from './HintPhase';
import {VotingPhase} from './VotingPhase';
import {DefensePhase} from './DefensePhase';
import {GuessPhase} from './GuessPhase';
import {GameResults} from './GameResults';
import {GameChat} from './GameChat';
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
    chatMessages,
    isLoading,
    error,
    isMyTurn,
    isLiar,
    isAlive,
    canVote,
    getPhaseInfo,
  } = useGameFlow();

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

  const phaseInfo = getPhaseInfo();
  const suspectedPlayer = players.find(p => p.id === currentLiar);
  const liarPlayer = players.find(p => p.role === 'liar');

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
            isMyTurn={isMyTurn()}
            isLiar={isLiar()}
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
            canEndDefense={currentPlayer?.isHost || currentLiar === currentPlayer?.id}
          />
        );

      case 'VOTING_FOR_SURVIVAL':
        return (
          <VotingPhase
            players={players}
            currentPlayer={currentPlayer}
            votingPhase="SURVIVAL_VOTE"
            targetPlayerId={currentLiar}
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
            isLiar={isLiar()}
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

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 게임 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 게임 단계 헤더 */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{phaseInfo.title}</div>
                <div className="text-muted-foreground mb-4">{phaseInfo.description}</div>

                {timer.isActive && (
                  <div className="flex justify-center items-center space-x-2">
                    <div className="text-lg font-mono">
                      {Math.floor(timer.timeRemaining / 60)}:
                      {(timer.timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-sm text-muted-foreground">남음</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 게임 단계별 컴포넌트 */}
          {renderGamePhase()}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 플레이어 목록 */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="font-medium mb-3">플레이어 목록</div>
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      player.id === currentTurnPlayerId
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium">{player.nickname}</span>
                      {player.isHost && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                          방장
                        </span>
                      )}
                    </div>
                    {player.id === currentTurnPlayerId && (
                      <div className="text-xs text-primary font-medium">턴</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 채팅 */}
          <GameChat
            players={players}
            currentPlayer={currentPlayer}
            gamePhase={gamePhase}
          />
        </div>
      </div>
    </div>
  );
};
