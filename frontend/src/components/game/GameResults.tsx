import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {useGameFlow} from '@/hooks/useGameFlow';
import {Crown, Target, Trophy, Users} from 'lucide-react';
import type {GameResult} from '@/types/gameFlow';
import type {Player} from '@/store/gameStore';

interface GameResultsProps {
  gameResult?: GameResult | null;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  onNextRound?: () => void;
  onReturnToLobby?: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({
  gameResult,
  players,
  currentRound,
  totalRounds,
  onNextRound,
  onReturnToLobby,
}) => {
  const [result, setResult] = useState<GameResult | null>(gameResult || null);
  const { getGameResult, isLoading } = useGameFlow();

  useEffect(() => {
    if (!result && !isLoading) {
      getGameResult()
        .then(setResult)
        .catch(console.error);
    }
  }, [result, isLoading, getGameResult]);

  if (isLoading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">게임 결과를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const isGameComplete = currentRound >= totalRounds;
  const winningTeam = result.winningTeam;
  const winners = result.players.filter(p => p.isWinner);
  const losers = result.players.filter(p => !p.isWinner);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 승리 팀 발표 */}
      <Card className={`border-2 ${winningTeam === 'CITIZENS' ? 'border-blue-500' : 'border-orange-500'}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className={`h-16 w-16 ${winningTeam === 'CITIZENS' ? 'text-blue-500' : 'text-orange-500'}`} />
          </div>
          <CardTitle className="text-2xl">
            {winningTeam === 'CITIZENS' ? '🏛️ 시민팀 승리!' : '🎭 라이어팀 승리!'}
          </CardTitle>
          <div className="text-muted-foreground">
            {result.reason}
          </div>
        </CardHeader>
      </Card>

      {/* 플레이어 결과 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 승리자 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <Crown className="mr-2 h-5 w-5" />
              승리자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {winners.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {player.nickname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.nickname}</div>
                      <Badge variant={player.role === 'LIAR' ? 'destructive' : 'default'} className="text-xs">
                        {player.role === 'LIAR' ? '라이어' : '시민'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{player.score}</div>
                    <div className="text-xs text-muted-foreground">점수</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 패배자 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Users className="mr-2 h-5 w-5" />
              패배자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {losers.map((player) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {player.nickname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{player.nickname}</div>
                      <Badge variant={player.role === 'LIAR' ? 'destructive' : 'default'} className="text-xs">
                        {player.role === 'LIAR' ? '라이어' : '시민'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{player.score}</div>
                    <div className="text-xs text-muted-foreground">점수</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 게임 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            게임 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {result.gameStatistics.currentRound}
              </div>
              <div className="text-sm text-muted-foreground">현재 라운드</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {result.gameStatistics.totalRounds}
              </div>
              <div className="text-sm text-muted-foreground">총 라운드</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(result.gameStatistics.totalDuration)}
              </div>
              <div className="text-sm text-muted-foreground">총 시간</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatDuration(result.gameStatistics.averageRoundDuration)}
              </div>
              <div className="text-sm text-muted-foreground">평균 라운드 시간</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-center space-x-4">
        {!isGameComplete && onNextRound && (
          <Button onClick={onNextRound} size="lg" className="min-w-[120px]">
            다음 라운드
          </Button>
        )}

        {onReturnToLobby && (
          <Button
            onClick={onReturnToLobby}
            variant={isGameComplete ? "default" : "outline"}
            size="lg"
            className="min-w-[120px]"
          >
            {isGameComplete ? '로비로 돌아가기' : '게임 종료'}
          </Button>
        )}
      </div>

      {/* 라운드 진행 상황 */}
      {!isGameComplete && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                라운드 진행 상황
              </div>
              <div className="flex justify-center space-x-2">
                {Array.from({ length: totalRounds }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < currentRound
                        ? 'bg-primary'
                        : i === currentRound
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentRound}/{totalRounds} 라운드 완료
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 게임 완료 메시지 */}
      {isGameComplete && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">🎉 모든 라운드가 완료되었습니다!</div>
              <div className="text-sm text-muted-foreground">
                수고하셨습니다. 다시 한 번 게임을 즐기고 싶으시면 새로운 게임을 시작해보세요.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
