import {Text} from '@mantine/core';
import {PlayerList} from './PlayerList';
import {GameStartButton} from './GameStartButton';
import {InProgressView} from './InProgressView';
import {GameResult} from '@/features/game-result/ui/GameResult';

const WaitingRoom = ({ gameState }) => (
  <>
    <Text>Waiting for players to join...</Text>
    <PlayerList players={gameState.players} />
    <GameStartButton gameNumber={gameState.gameNumber} />
  </>
);

export const GameView = ({ gameState }) => {
  if (!gameState) return <Text>Loading game state...</Text>;

  switch (gameState.status) {
    case 'WAITING':
      return <WaitingRoom gameState={gameState} />;
    case 'IN_PROGRESS':
      return <InProgressView gameState={gameState} />;
    case 'FINISHED':
      return <GameResult gameNumber={gameState.gameNumber} />;
    default:
      return <Text>Unknown game status: {gameState.status}</Text>;
  }
};