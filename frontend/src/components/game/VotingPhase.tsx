import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {useGameFlow} from '@/hooks/useGameFlow';
import {Clock, Users, Vote} from 'lucide-react';
import type {Player} from '@/stores';

interface VotingPhaseProps {
  players: Player[];
  currentPlayer: Player | null;
  votingPhase: 'LIAR_VOTE' | 'SURVIVAL_VOTE';
  targetPlayerId?: string;
  votes: Record<string, string>;
  timeRemaining: number;
  canVote: boolean;
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  currentPlayer,
  votingPhase,
  targetPlayerId,
  votes,
  timeRemaining,
  canVote,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const { voteForLiar, castFinalVote, isLoading, error } = useGameFlow();

  const handleVote = async () => {
    try {
      if (votingPhase === 'LIAR_VOTE' && selectedPlayer) {
        await voteForLiar(parseInt(selectedPlayer));
      } else if (votingPhase === 'SURVIVAL_VOTE') {
        await castFinalVote(selectedPlayer === 'execute');
      }
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };

  const getVotingTitle = () => {
    switch (votingPhase) {
      case 'LIAR_VOTE':
        return '라이어 투표';
      case 'SURVIVAL_VOTE': {
        return '생존 투표';
      }
      default:
        return '투표';
    }
  };

  const getVotingDescription = () => {
    switch (votingPhase) {
      case 'LIAR_VOTE':
        return '라이어라고 생각하는 플레이어에게 투표하세요.';
      case 'SURVIVAL_VOTE': {
        const suspectedPlayer = players.find(p => p.id === targetPlayerId);
        return `${suspectedPlayer?.nickname || '의심받는 플레이어'}를 처형할지 결정하세요.`;
      }
      default:
        return '';
    }
  };

  const getPlayerVoteCount = (playerId: string) => {
    return Object.values(votes).filter(vote => vote === playerId).length;
  };

  const hasVoted = currentPlayer && votes[currentPlayer.id];

  return (
    <div className="space-y-4">
      {/* 투표 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Vote className="mr-2 h-5 w-5" />
              {getVotingTitle()}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{getVotingDescription()}</p>
          {hasVoted && (
            <div className="mt-2 text-green-600 font-medium">
              ✓ 투표가 완료되었습니다
            </div>
          )}
        </CardContent>
      </Card>

      {/* 투표 옵션 */}
      {votingPhase === 'LIAR_VOTE' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              플레이어 목록
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players
                .filter(player => player.isAlive !== false && player.id !== currentPlayer?.id)
                .map((player) => {
                  const voteCount = getPlayerVoteCount(player.id);
                  const isSelected = selectedPlayer === player.id;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      } ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (canVote && !hasVoted) {
                          setSelectedPlayer(isSelected ? null : player.id);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {player.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{player.nickname}</div>
                          {player.isHost && (
                            <div className="text-xs text-muted-foreground">방장</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {voteCount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {voteCount}표
                          </div>
                        )}
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 생존 투표 */}
      {votingPhase === 'SURVIVAL_VOTE' && (
        <Card>
          <CardHeader>
            <CardTitle>처형 여부 결정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlayer === 'execute'
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border hover:border-destructive/50'
                } ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (canVote && !hasVoted) {
                    setSelectedPlayer(selectedPlayer === 'execute' ? null : 'execute');
                  }
                }}
              >
                <div>
                  <div className="font-medium text-destructive">처형</div>
                  <div className="text-sm text-muted-foreground">의심받는 플레이어를 제거합니다</div>
                </div>
                {selectedPlayer === 'execute' && (
                  <div className="w-4 h-4 rounded-full bg-destructive" />
                )}
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlayer === 'spare'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:border-green-500/50'
                } ${!canVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (canVote && !hasVoted) {
                    setSelectedPlayer(selectedPlayer === 'spare' ? null : 'spare');
                  }
                }}
              >
                <div>
                  <div className="font-medium text-green-600">생존</div>
                  <div className="text-sm text-muted-foreground">의심받는 플레이어를 살려둡니다</div>
                </div>
                {selectedPlayer === 'spare' && (
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 투표 버튼 */}
      {canVote && !hasVoted && (
        <div className="flex justify-center">
          <Button
            onClick={handleVote}
            disabled={!selectedPlayer || isLoading}
            size="lg"
            className="w-full max-w-xs"
          >
            {isLoading ? '투표 중...' : '투표하기'}
          </Button>
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* 투표 현황 */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm">투표 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {Object.keys(votes).length} / {players.filter(p => p.isAlive !== false).length}명 투표 완료
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
