import React, {useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {type Player} from '@/types/game';
import {PlayerCard} from '@/versions/main/components/PlayerCard';
import {CheckCircle, Shield, Target, Users, Vote} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface VoteResult {
  playerId: string;
  playerName: string;
  voteCount: number;
  voters: string[];
}

export interface VotingPanelProps {
  // Core data
  players: Player[];
  currentUserId: string;
  phase: 'voting' | 'defense' | 'results';
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  
  // Voting state
  selectedPlayerId?: string;
  hasVoted: boolean;
  voteResults?: VoteResult[];
  eliminatedPlayerId?: string;
  
  // Callbacks
  onPlayerSelect?: (playerId: string) => void;
  onVoteSubmit?: () => void;
  onVoteChange?: () => void;
  
  // Configuration
  allowVoteChange?: boolean;
  showVoteCount?: boolean;
  showVoters?: boolean;
  variant?: 'compact' | 'detailed';
  
  className?: string;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  players,
  currentUserId,
  phase,
  timeRemaining,
  totalTime,
  selectedPlayerId,
  hasVoted,
  voteResults = [],
  eliminatedPlayerId,
  onPlayerSelect,
  onVoteSubmit,
  onVoteChange,
  allowVoteChange = false,
  showVoteCount = false,
  showVoters = false,
  variant = 'detailed',
  className,
}) => {
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedPlayerId);
  
  useEffect(() => {
    setLocalSelectedId(selectedPlayerId);
  }, [selectedPlayerId]);

  const handlePlayerSelect = (player: Player) => {
    if (hasVoted && !allowVoteChange) return;
    if (player.id === currentUserId) return; // Can't vote for yourself
    if (!player.isOnline) return;
    
    const newSelectedId = player.id === localSelectedId ? undefined : player.id;
    setLocalSelectedId(newSelectedId);
    onPlayerSelect?.(newSelectedId || '');
  };

  const handleVoteSubmit = () => {
    if (!localSelectedId || hasVoted) return;
    onVoteSubmit?.();
  };

  const handleVoteChange = () => {
    if (!allowVoteChange) return;
    onVoteChange?.();
  };

  const getVoteCountForPlayer = (playerId: string): number => {
    return voteResults.find(result => result.playerId === playerId)?.voteCount || 0;
  };


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const isTimeWarning = timeRemaining <= 30;
  const isTimeCritical = timeRemaining <= 10;

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const playerGridVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const playerItemVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 }
  };

  const renderPhaseHeader = () => {
    const phaseConfig = {
      voting: {
        title: '투표 중',
        description: '라이어로 의심되는 플레이어에게 투표하세요',
        icon: Vote,
        color: 'text-blue-600'
      },
      defense: {
        title: '변론 시간',
        description: '투표받은 플레이어의 변론을 들어보세요',
        icon: Shield,
        color: 'text-orange-600'
      },
      results: {
        title: '투표 결과',
        description: '투표 결과를 확인하세요',
        icon: Target,
        color: 'text-red-600'
      }
    };

    const config = phaseConfig[phase];
    const Icon = config.icon;

    return (
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className={cn("h-6 w-6", config.color)} />
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {config.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              "text-2xl font-bold",
              isTimeCritical && "text-red-500 animate-pulse",
              isTimeWarning && !isTimeCritical && "text-orange-500"
            )}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-muted-foreground">
              남은 시간
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <Progress 
            value={getProgressPercentage()} 
            className={cn(
              "h-2",
              isTimeCritical && "text-red-500",
              isTimeWarning && !isTimeCritical && "text-orange-500"
            )}
            style={{
              '--progress-color': isTimeCritical ? '#ef4444' : isTimeWarning ? '#f97316' : undefined
            } as React.CSSProperties}
          />
        </div>
      </CardHeader>
    );
  };

  const renderVotingContent = () => (
    <div className="space-y-4">
      <motion.div
        variants={playerGridVariants}
        initial="initial"
        animate="animate"
        className={cn(
          "grid gap-3",
          variant === 'compact' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
        )}
      >
        {players
          .filter(player => player.id !== currentUserId)
          .map((player) => (
          <motion.div
            key={player.id}
            variants={playerItemVariants}
            className="relative"
          >
            <PlayerCard
              player={player}
              variant={variant === 'compact' ? 'voting' : 'game'}
              selected={localSelectedId === player.id}
              onVote={(_playerId) => handlePlayerSelect(player)}
              className={cn(
                !player.isOnline && "opacity-50 cursor-not-allowed",
                player.id === currentUserId && "opacity-50 cursor-not-allowed"
              )}
            />
            
            {showVoteCount && voteResults.length > 0 && (
              <div className="absolute -top-2 -right-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {getVoteCountForPlayer(player.id)}표
                </Badge>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Voting Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {players.filter(p => p.hasVoted).length} / {players.length - 1} 명 투표 완료
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasVoted && allowVoteChange && (
            <Button
              onClick={handleVoteChange}
              variant="outline"
              size="sm"
            >
              투표 변경
            </Button>
          )}
          
          <Button
            onClick={handleVoteSubmit}
            variant={localSelectedId ? "vote" : "secondary"}
            disabled={!localSelectedId || (hasVoted && !allowVoteChange)}
            className="min-w-[100px]"
          >
            {hasVoted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                투표 완료
              </>
            ) : (
              <>
                <Vote className="h-4 w-4 mr-1" />
                투표하기
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDefenseContent = () => {
    const defendingPlayer = players.find(p => p.id === eliminatedPlayerId);
    if (!defendingPlayer) return null;

    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="inline-flex items-center space-x-2 bg-orange-50 dark:bg-orange-950 px-4 py-2 rounded-lg">
            <Shield className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              {defendingPlayer.nickname}님이 변론 중입니다
            </span>
          </div>
        </div>
        
        <PlayerCard
          player={defendingPlayer}
          variant="game"
          className="max-w-md mx-auto"
        />
        
        {showVoteCount && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">투표 결과</h4>
            <div className="space-y-2">
              {voteResults
                .sort((a, b) => b.voteCount - a.voteCount)
                .map((result) => (
                <div key={result.playerId} className="flex items-center justify-between">
                  <span className="text-sm">{result.playerName}</span>
                  <Badge variant="secondary">
                    {result.voteCount}표
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResultsContent = () => {
    const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);

    return (
      <div className="space-y-4">
        {eliminatedPlayer && (
          <div className="text-center py-6">
            <div className="inline-flex items-center space-x-2 bg-red-50 dark:bg-red-950 px-4 py-2 rounded-lg mb-4">
              <Target className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {eliminatedPlayer.nickname}님이 탈락했습니다
              </span>
            </div>
            
            <PlayerCard
              player={eliminatedPlayer}
              variant="results"
              className="max-w-md mx-auto"
            />
          </div>
        )}
        
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center space-x-2">
            <Vote className="h-4 w-4" />
            <span>최종 투표 결과</span>
          </h4>
          
          <div className="space-y-3">
            {voteResults
              .sort((a, b) => b.voteCount - a.voteCount)
              .map((result, index) => (
              <div 
                key={result.playerId}
                className={cn(
                  "flex items-center justify-between p-2 rounded",
                  index === 0 && "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                )}
              >
                <span className="font-medium">{result.playerName}</span>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={index === 0 ? "destructive" : "secondary"}
                    className="min-w-[50px] justify-center"
                  >
                    {result.voteCount}표
                  </Badge>
                  {showVoters && result.voters.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ({result.voters.join(', ')})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case 'voting':
        return renderVotingContent();
      case 'defense':
        return renderDefenseContent();
      case 'results':
        return renderResultsContent();
      default:
        return null;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      <Card className="shadow-lg">
        {renderPhaseHeader()}
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VotingPanel;