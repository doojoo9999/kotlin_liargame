import React from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Crown, Shield, Target} from 'lucide-react';
import {cn} from '@/lib/utils';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  role?: 'host' | 'liar' | 'citizen';
  status: 'waiting' | 'ready' | 'playing' | 'voted' | 'defending' | 'eliminated';
  score?: number;
  isHost?: boolean;
  isOnline?: boolean;
  lastActivity?: Date;
}

interface PlayerCardProps {
  player: Player;
  variant?: 'compact' | 'detailed' | 'voting' | 'result';
  isCurrentPlayer?: boolean;
  isSelected?: boolean;
  showRole?: boolean;
  showScore?: boolean;
  showStatus?: boolean;
  onSelect?: (player: Player) => void;
  onVote?: (player: Player) => void;
  className?: string;
}

const statusColors = {
  waiting: 'bg-gray-500',
  ready: 'bg-green-500',
  playing: 'bg-blue-500',
  voted: 'bg-purple-500',
  defending: 'bg-orange-500',
  eliminated: 'bg-red-500',
};

const roleIcons = {
  host: Crown,
  liar: Target,
  citizen: Shield,
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  variant = 'compact',
  isCurrentPlayer = false,
  isSelected = false,
  showRole = false,
  showScore = false,
  showStatus = true,
  onSelect,
  onVote,
  className,
}) => {
  const RoleIcon = roleIcons[player.role as keyof typeof roleIcons];

  const cardVariants = {
    initial: { scale: 1, opacity: 0.9 },
    hover: { scale: 1.02, opacity: 1 },
    selected: { scale: 1.05, opacity: 1 },
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

  const renderCompactView = () => (
    <div className="flex items-center space-x-3 p-2">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback className="text-sm">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Online Status Indicator */}
        {player.isOnline && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
        )}
        
        {/* Host Crown */}
        {player.isHost && (
          <Crown className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-foreground truncate">
            {player.name}
          </p>
          {showRole && RoleIcon && (
            <RoleIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {showStatus && (
          <div className="flex items-center space-x-2 mt-1">
            <div className={cn("h-2 w-2 rounded-full", statusColors[player.status])} />
            <span className="text-xs text-muted-foreground capitalize">
              {player.status}
            </span>
            {showScore && player.score !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {player.score}점
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback>
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            
            {player.isOnline && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">{player.name}</h3>
              {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
              {showRole && RoleIcon && (
                <RoleIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            
            {showStatus && (
              <div className="flex items-center space-x-2 mt-1">
                <div className={cn("h-2 w-2 rounded-full", statusColors[player.status])} />
                <span className="text-sm text-muted-foreground capitalize">
                  {player.status}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {showScore && player.score !== undefined && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {player.score}점
          </Badge>
        )}
      </div>
      
      {variant === 'voting' && onVote && (
        <Button
          onClick={() => onVote(player)}
          variant="vote"
          size="sm"
          className="w-full"
          disabled={player.status === 'eliminated'}
        >
          투표하기
        </Button>
      )}
    </div>
  );

  const renderVotingView = () => (
    <div className="p-3 text-center space-y-2">
      <div className="relative mx-auto">
        <Avatar className="h-16 w-16 mx-auto">
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback className="text-lg">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        
        {player.isOnline && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white" />
        )}
        
        {player.isHost && (
          <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />
        )}
      </div>
      
      <div>
        <p className="font-medium text-foreground text-sm">{player.name}</p>
        {showStatus && (
          <div className="flex items-center justify-center space-x-1 mt-1">
            <div className={cn("h-2 w-2 rounded-full", statusColors[player.status])} />
            <span className="text-xs text-muted-foreground capitalize">
              {player.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderResultView = () => (
    <div className="p-4 text-center space-y-3">
      <div className="relative mx-auto">
        <Avatar className="h-20 w-20 mx-auto">
          <AvatarImage src={player.avatar} alt={player.name} />
          <AvatarFallback className="text-xl">
            {getInitials(player.name)}
          </AvatarFallback>
        </Avatar>
        
        {showRole && RoleIcon && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="bg-background border-2 border-border rounded-full p-1">
              <RoleIcon className="h-4 w-4" />
            </div>
          </div>
        )}
        
        {player.isHost && (
          <Crown className="absolute -top-1 -right-1 h-6 w-6 text-yellow-500" />
        )}
      </div>
      
      <div>
        <h3 className="font-semibold text-foreground">{player.name}</h3>
        {showRole && player.role && (
          <p className="text-sm text-muted-foreground capitalize">
            {player.role === 'liar' ? '라이어' : player.role === 'citizen' ? '시민' : '호스트'}
          </p>
        )}
      </div>
      
      {showScore && player.score !== undefined && (
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {player.score}점
        </Badge>
      )}
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case 'compact':
        return renderCompactView();
      case 'detailed':
        return renderDetailedView();
      case 'voting':
        return renderVotingView();
      case 'result':
        return renderResultView();
      default:
        return renderCompactView();
    }
  };

  const isInteractive = onSelect || onVote;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      whileHover={isInteractive ? "hover" : undefined}
      whileTap={isInteractive ? "tap" : undefined}
      animate={isSelected ? "selected" : "initial"}
      className={cn("cursor-pointer", className)}
      onClick={() => onSelect?.(player)}
    >
      <Card
        className={cn(
          "transition-all duration-200",
          isCurrentPlayer && "ring-2 ring-primary ring-offset-2",
          isSelected && "ring-2 ring-orange-500 ring-offset-2 bg-orange-50 dark:bg-orange-950",
          player.status === 'eliminated' && "opacity-50 grayscale",
          isInteractive && "hover:shadow-md"
        )}
      >
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerCard;