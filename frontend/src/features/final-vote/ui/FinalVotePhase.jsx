import {useAuthStore} from '@/stores/authStore';
import {useCastFinalVote} from '@/features/final-vote/hooks/useCastFinalVote';
import {Alert, Button, Group, Paper, Stack, Text, Title} from '@mantine/core';

export const FinalVotePhase = ({ gameState }) => {
  const { user } = useAuthStore();
  const castFinalVoteMutation = useCastFinalVote();

  const currentPlayer = gameState.players.find(p => p.nickname === user.nickname);
  const accusedPlayer = gameState.players.find(p => p.state === 'DEFENDED');

  if (!accusedPlayer) {
    return <Alert color="yellow">Waiting for defense...</Alert>;
  }

  const handleVote = (voteForExecution) => {
    castFinalVoteMutation.mutate({
      gameNumber: gameState.gameNumber,
      voteForExecution,
    });
  };

  const renderContent = () => {
    if (!currentPlayer || !currentPlayer.isAlive || currentPlayer.id === accusedPlayer.id) {
      return <Text>Waiting for the final judgment.</Text>;
    }

    if (currentPlayer.state === 'VOTED') {
      return <Text>You have cast your judgment. Waiting for other players...</Text>;
    }

    return (
      <Stack>
        <Text>What is your judgment?</Text>
        <Group grow>
          <Button
            color="green"
            onClick={() => handleVote(false)}
            loading={castFinalVoteMutation.isPending}
          >
            Let Live
          </Button>
          <Button
            color="red"
            onClick={() => handleVote(true)}
            loading={castFinalVoteMutation.isPending}
          >
            Execute
          </Button>
        </Group>
      </Stack>
    );
  };

  return (
    <Stack>
      <Title order={3}>Final Judgment</Title>
      <Alert color="gray" title={`${accusedPlayer.nickname}'s Defense`}>
        <Text>{accusedPlayer.defense || "No defense was provided."}</Text>
      </Alert>
      <Paper withBorder p="md" mt="md">
        {renderContent()}
      </Paper>
    </Stack>
  );
};
