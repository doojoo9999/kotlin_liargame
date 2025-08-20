import {useGameResult} from '@/features/game-result/hooks/useGameResult';
import {Alert, Center, Loader, Paper, Stack, Text, Title} from '@mantine/core';

export const GameResult = ({ gameNumber }) => {
  const { data: result, isLoading, isError } = useGameResult(gameNumber);

  if (isLoading) {
    return <Center><Loader /></Center>;
  }

  if (isError || !result) {
    return <Alert color="red">Failed to load game results.</Alert>;
  }

  return (
    <Paper withBorder p="xl" shadow="md">
      <Stack align="center">
        <Title order={2}>Game Over</Title>
        <Title order={3} c={result.winningTeam === 'LIARS' ? 'red' : 'blue'}>
          {result.winningTeam} Win!
        </Title>
        <Text>The word was: <strong>{result.word}</strong></Text>
        
        <Stack mt="lg">
          <Title order={4}>Players</Title>
          {result.players.map(player => (
            <Text key={player.id}>
              {player.nickname} - {player.role}
            </Text>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
