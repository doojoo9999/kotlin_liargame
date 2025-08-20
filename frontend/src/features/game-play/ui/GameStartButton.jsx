import {Button} from '@/shared/ui';
import {useStartGame} from '@/features/game-play/hooks/useStartGame';

export const GameStartButton = ({ gameNumber }) => {
  const startGameMutation = useStartGame();

  const handleStartGame = () => {
    startGameMutation.mutate(gameNumber);
  };

  // A real implementation would check if the current user is the host
  // const { user } = useAuthStore();
  // const isHost = gameState.hostId === user.id;
  // if (!isHost) return null;

  return (
    <Button 
      onClick={handleStartGame} 
      loading={startGameMutation.isPending}
      mt="md"
    >
      Start Game
    </Button>
  );
};
