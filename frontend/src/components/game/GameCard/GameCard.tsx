import React from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {AlertCircle, CheckCircle, Clock, Crown, Lock, Play, Settings, Unlock, Users} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  hasPassword: boolean;
  settings: {
    roundTime: number; // seconds
    discussionTime: number; // seconds
    defenseTime: number; // seconds
    allowSpectators: boolean;
  };
  players: Array<{
    id: string;
    name: string;
    avatar?: string;
    isReady: boolean;
  }>;
  createdAt: Date;
  estimatedDuration?: number; // minutes
}

interface GameCardProps {
  room: GameRoom;
  variant?: 'compact' | 'detailed';
  showPlayers?: boolean;
  showSettings?: boolean;
  canJoin?: boolean;
  isJoining?: boolean;
  onJoin?: (room: GameRoom) => void;
  onSpectate?: (room: GameRoom) => void;
  onDetails?: (room: GameRoom) => void;
  className?: string;
}

const statusConfig = {
  waiting: {
    color: 'bg-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    icon: Clock,
    text: '대기 중',
  },
  playing: {
    color: 'bg-green-500',
    textColor: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950',
    icon: Play,
    text: '게임 중',
  },
  finished: {
    color: 'bg-gray-500',
    textColor: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    icon: CheckCircle,
    text: '종료됨',
  },
};

export const GameCard: React.FC<GameCardProps> = ({
  room,
  variant = 'compact',
  showPlayers = true,
  showSettings = true,
  canJoin = true,
  isJoining = false,
  onJoin,
  onSpectate,
  onDetails,
  className,
}) => {
  const status = statusConfig[room.status];
  const StatusIcon = status.icon;
  const isFull = room.currentPlayers >= room.maxPlayers;
  const canJoinRoom = canJoin && room.status === 'waiting' && !isFull;
  const canSpectate = room.status === 'playing' && room.settings.allowSpectators;

  const cardVariants = {
    initial: { scale: 1, opacity: 0.95 },
    hover: { scale: 1.02, opacity: 1 },
    tap: { scale: 0.98 },
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
  };

  const getElapsedTime = () => {
    const now = new Date();
    const elapsed = now.getTime() - room.createdAt.getTime();
    const minutes = Math.floor(elapsed / (1000 * 60));
    return minutes < 60 ? `${minutes}분 전` : `${Math.floor(minutes / 60)}시간 전`;
  };

  const renderHeader = () => (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {room.name}
          </h3>
          {room.isPrivate && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          {room.hasPassword && (
            <Badge variant="outline" className="text-xs">
              🔑
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-full", status.bgColor)}>
            <StatusIcon className={cn("h-3 w-3", status.textColor)} />
            <span className={cn("text-xs font-medium", status.textColor)}>
              {status.text}
            </span>
          </div>
        </div>
      </div>
    </CardHeader>
  );

  const renderHostInfo = () => (
    <div className="flex items-center space-x-2 mb-3">
      <Avatar className="h-6 w-6">
        <AvatarImage src={room.hostAvatar} alt={room.hostName} />
        <AvatarFallback className="text-xs">
          {getInitials(room.hostName)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground">
        호스트: {room.hostName}
      </span>
      <Crown className="h-3 w-3 text-yellow-500" />
    </div>
  );

  const renderPlayerCount = () => (
    <div className="flex items-center space-x-2 mb-3">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-foreground">
        {room.currentPlayers} / {room.maxPlayers} 명
      </span>
      {isFull && (
        <Badge variant="destructive" className="text-xs">
          만석
        </Badge>
      )}
    </div>
  );

  const renderGameSettings = () => (
    showSettings && variant === 'detailed' && (
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>라운드: {formatDuration(room.settings.roundTime)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Settings className="h-3 w-3" />
          <span>토론: {formatDuration(room.settings.discussionTime)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>변론: {formatDuration(room.settings.defenseTime)}</span>
        </div>
        <div className="flex items-center space-x-1">
          {room.settings.allowSpectators ? (
            <Unlock className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          <span>관전: {room.settings.allowSpectators ? '허용' : '불허'}</span>
        </div>
      </div>
    )
  );

  const renderPlayers = () => (
    showPlayers && variant === 'detailed' && room.players.length > 0 && (
      <div className="mb-3">
        <div className="flex items-center space-x-1 mb-2">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">참가자</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {room.players.slice(0, 6).map((player) => (
            <div
              key={player.id}
              className="flex items-center space-x-1 bg-muted rounded-full px-2 py-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={player.avatar} alt={player.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-foreground">
                {player.name}
              </span>
              {player.isReady && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
          ))}
          {room.players.length > 6 && (
            <div className="flex items-center justify-center bg-muted rounded-full px-2 py-1">
              <span className="text-xs text-muted-foreground">
                +{room.players.length - 6}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  );

  const renderActions = () => (
    <div className="flex space-x-2 pt-2">
      {canJoinRoom && onJoin && (
        <Button
          onClick={() => onJoin(room)}
          variant={room.hasPassword ? "outline" : "game"}
          size="sm"
          className="flex-1"
          disabled={isJoining}
        >
          {isJoining ? '참가 중...' : room.hasPassword ? '🔑 참가' : '참가하기'}
        </Button>
      )}
      
      {canSpectate && onSpectate && (
        <Button
          onClick={() => onSpectate(room)}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          관전하기
        </Button>
      )}
      
      {onDetails && (
        <Button
          onClick={() => onDetails(room)}
          variant="outline"
          size="sm"
          className={cn(
            canJoinRoom || canSpectate ? "flex-none px-3" : "flex-1"
          )}
        >
          {canJoinRoom || canSpectate ? "👁️" : "자세히"}
        </Button>
      )}
    </div>
  );

  const renderCompactContent = () => (
    <CardContent className="pt-0">
      <div className="space-y-2">
        {renderHostInfo()}
        {renderPlayerCount()}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{getElapsedTime()}</span>
          {room.estimatedDuration && (
            <span>예상 {room.estimatedDuration}분</span>
          )}
        </div>
        {renderActions()}
      </div>
    </CardContent>
  );

  const renderDetailedContent = () => (
    <CardContent className="pt-0">
      <div className="space-y-3">
        {renderHostInfo()}
        {renderPlayerCount()}
        {renderGameSettings()}
        {renderPlayers()}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <span>생성: {getElapsedTime()}</span>
          {room.estimatedDuration && (
            <span>예상 소요시간: {room.estimatedDuration}분</span>
          )}
        </div>
        
        {renderActions()}
      </div>
    </CardContent>
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={className}
    >
      <Card className={cn(
        "transition-all duration-200 hover:shadow-lg",
        room.status === 'waiting' && "border-blue-200 dark:border-blue-800",
        room.status === 'playing' && "border-green-200 dark:border-green-800",
        room.status === 'finished' && "opacity-75"
      )}>
        {renderHeader()}
        {variant === 'compact' ? renderCompactContent() : renderDetailedContent()}
      </Card>
    </motion.div>
  );
};

export default GameCard;