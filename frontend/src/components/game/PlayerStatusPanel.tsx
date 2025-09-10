import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {CheckCircle, Clock, Crown, Eye, MessageCircle, Shield, Target, WifiOff, Zap} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import type {GamePhase, Player} from '@/store/gameStore';

interface PlayerStatusPanelProps {
  players: Player[];
  currentPlayer: Player | null;
  gamePhase: GamePhase;
  currentTurnPlayerId: string | null;
  votes: Record<string, string>;
  isLiar?: boolean;
  suspectedPlayer?: string;
}

interface PlayerActivityLog {
  playerId: string;
  action: string;
  timestamp: number;
  type: 'hint' | 'vote' | 'defense' | 'guess' | 'system';
}

export const PlayerStatusPanel: React.FC<PlayerStatusPanelProps> = ({
  players,
  currentPlayer,
  gamePhase,
  currentTurnPlayerId,
  votes,
  isLiar = false,
  suspectedPlayer,
}) => {
  const [activityLog, setActivityLog] = React.useState<PlayerActivityLog[]>([]);

  const getPlayerStatus = (player: Player) => {
    if (!player.isOnline) return 'offline';
    if (player.id === currentTurnPlayerId) return 'active';
    if (votes[player.id]) return 'voted';
    if (player.isReady) return 'ready';
    return 'waiting';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'offline':
        return {
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          icon: <WifiOff className="h-3 w-3" />,
          label: '오프라인'
        };
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: <Zap className="h-3 w-3" />,
          label: '진행 중'
        };
      case 'voted':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <CheckCircle className="h-3 w-3" />,
          label: '완료'
        };
      case 'ready':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          icon: <CheckCircle className="h-3 w-3" />,
          label: '준비됨'
        };
      default:
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: <Clock className="h-3 w-3" />,
          label: '대기 중'
        };
    }
  };

  const getPlayerRole = (player: Player) => {
    if (player.id === suspectedPlayer) return 'suspected';
    if (isLiar && player.id === currentPlayer?.id) return 'liar';
    if (player.isHost) return 'host';
    return 'citizen';
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'liar':
        return {
          label: '라이어',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          icon: <Eye className="h-3 w-3" />
        };
      case 'suspected':
        return {
          label: '의심받는 중',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          icon: <Target className="h-3 w-3" />
        };
      case 'host':
        return {
          label: '방장',
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          icon: <Crown className="h-3 w-3" />
        };
      default:
        return {
          label: '시민',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: <Shield className="h-3 w-3" />
        };
    }
  };

  const getVoteCount = (playerId: string) => {
    return Object.values(votes).filter(vote => vote === playerId).length;
  };

  const formatLastActive = (timestamp?: number) => {
    if (!timestamp) return '알 수 없음';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes === 0) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    return `${Math.floor(minutes / 60)}시간 전`;
  };

  return (
    <div className="space-y-4">
      {/* Player List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Users className="mr-2 h-4 w-4" />
            플레이어 현황 ({players.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {players.map((player) => {
                const status = getPlayerStatus(player);
                const statusConfig = getStatusConfig(status);
                const role = getPlayerRole(player);
                const roleConfig = getRoleConfig(role);
                const voteCount = getVoteCount(player.id);
                const isCurrentPlayer = player.id === currentPlayer?.id;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all
                      ${isCurrentPlayer ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}
                      ${player.id === currentTurnPlayerId ? 'ring-2 ring-green-300 ring-opacity-50' : ''}
                      ${!player.isOnline ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs ${roleConfig.bgColor} ${roleConfig.color}`}>
                            {player.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online Status Indicator */}
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            player.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium text-sm truncate ${
                            isCurrentPlayer ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {player.nickname}
                            {isCurrentPlayer && ' (나)'}
                          </span>
                          
                          {/* Role Badge */}
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${roleConfig.bgColor} ${roleConfig.color}`}
                          >
                            <div className="flex items-center space-x-1">
                              {roleConfig.icon}
                              <span>{roleConfig.label}</span>
                            </div>
                          </Badge>
                        </div>

                        {/* Status and Last Active */}
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`flex items-center space-x-1 text-xs ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            • {formatLastActive(player.lastActive)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center space-x-2">
                      {/* Vote Count */}
                      {voteCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {voteCount}표
                        </Badge>
                      )}

                      {/* Turn Indicator */}
                      {player.id === currentTurnPlayerId && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-green-600 font-medium">턴</span>
                        </div>
                      )}

                      {/* Actions Available */}
                      {gamePhase === 'SPEECH' && player.id === currentTurnPlayerId && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          <MessageCircle className="mr-1 h-3 w-3" />
                          힌트 제공
                        </Badge>
                      )}

                      {gamePhase === 'DEFENDING' && player.id === suspectedPlayer && (
                        <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                          <Shield className="mr-1 h-3 w-3" />
                          변론 중
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {players.filter(p => p.isOnline).length}
              </div>
              <div className="text-xs text-gray-600">온라인</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Object.keys(votes).length}
              </div>
              <div className="text-xs text-gray-600">투표 완료</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase-specific Information */}
      {gamePhase === 'VOTING_FOR_LIAR' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="text-sm text-red-800">
              <div className="font-medium mb-2">🎯 투표 현황</div>
              <div className="space-y-1">
                {players
                  .filter(p => getVoteCount(p.id) > 0)
                  .sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id))
                  .map(player => (
                    <div key={player.id} className="flex justify-between">
                      <span>{player.nickname}</span>
                      <span className="font-medium">{getVoteCount(player.id)}표</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};