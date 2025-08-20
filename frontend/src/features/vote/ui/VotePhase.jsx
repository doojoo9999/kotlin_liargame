import {useAuthStore} from '@/stores/authStore';
import {useCastVote} from '@/features/vote/hooks/useCastVote';
import {Button, Paper, SimpleGrid, Stack, Text, Title} from '@mantine/core';

export const VotePhase = ({ gameState }) => {
  const { user } = useAuthStore();
  const castVoteMutation = useCastVote();

  const currentPlayer = gameState.players.find(p => p.nickname === user.nickname);

  const handleVote = (targetPlayerId) => {
    castVoteMutation.mutate({
      gameNumber: gameState.gameNumber,
      targetPlayerId,
    });
  };

  const renderContent = () => {
    if (!currentPlayer || !currentPlayer.isAlive) {
      return <Text>You are observing the vote.</Text>;
    }

    if (currentPlayer.state === 'VOTED') {
      return <Text>You have voted. Waiting for other players...</Text>;
    }

    if (currentPlayer.state === 'WAITING_FOR_VOTE') {
      const votablePlayers = gameState.players.filter(p => p.isAlive && p.id !== currentPlayer.id);
      return (
        <Stack>
          <Text>Who is the Liar?</Text>
          <SimpleGrid cols={2}>
            {votablePlayers.map(player => (
              <Button
                key={player.id}
                onClick={() => handleVote(player.id)}
                loading={castVoteMutation.isPending}
              >
                {player.nickname}
              </Button>
            ))}
          </SimpleGrid>
        </Stack>
      );
    }

    return <Text>Waiting for the voting phase to begin...</Text>;
  };

  return (
    <Stack>
      <Title order={3}>Round {gameState.currentRound}: Vote for the Liar</Title>
      <Paper withBorder p="md">
        <Title order={4}>Hints</Title>
        {gameState.players.filter(p => p.isAlive).map(p => (
          <Text key={p.id}><strong>{p.nickname}:</strong> {p.hint || '...'}</Text>
        ))}
      </Paper>
      <Paper withBorder p="md" mt="md">
        {renderContent()}
      </Paper>
    </Stack>
  );
};
