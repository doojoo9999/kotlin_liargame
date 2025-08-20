import {useGame} from '@/features/game-play/hooks/useGame';
import {ChatWindow} from '@/features/chat/ui/ChatWindow';
import {GameView} from '@/features/game-play/ui/GameView';
import {GameInfoDisplay} from '@/features/game-play/ui/GameInfoDisplay';
import {Alert, Center, Grid, Loader, Paper, Stack} from '@mantine/core';

export const GameRoomPage = () => {
  const { roomId, gameState, isLoading, isError } = useGame();

  if (isLoading) {
    return <Center style={{ height: '100vh' }}><Loader /></Center>;
  }

  if (isError) {
    return (
      <Center style={{ height: '100vh' }}>
        <Alert color="red" title="Error">
          Failed to load game state for room #{roomId}.
        </Alert>
      </Center>
    );
  }

  return (
    <Grid p="md">
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack>
          {gameState && <GameInfoDisplay gameState={gameState} />}
          <Paper withBorder p="md" style={{ minHeight: '450px' }}>
            {gameState ? <GameView gameState={gameState} /> : <Loader />}
          </Paper>
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <ChatWindow roomId={roomId} />
      </Grid.Col>
    </Grid>
  );
};
