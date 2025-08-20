import {useState} from 'react';
import {useAuthStore} from '@/stores/authStore';
import {useSubmitDefense} from '@/features/defense/hooks/useSubmitDefense';
import {Alert, Button, Paper, Stack, Text, TextInput, Title} from '@mantine/core';

export const DefensePhase = ({ gameState }) => {
  const { user } = useAuthStore();
  const [defenseText, setDefenseText] = useState('');
  const submitDefenseMutation = useSubmitDefense();

  const currentPlayer = gameState.players.find(p => p.nickname === user.nickname);
  const accusedPlayer = gameState.players.find(p => p.state === 'ACCUSED');

  if (!accusedPlayer) {
    return <Alert color="yellow">Waiting for accusation...</Alert>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (defenseText.trim()) {
      submitDefenseMutation.mutate({
        gameNumber: gameState.gameNumber,
        defenseText,
      });
    }
  };

  const renderContent = () => {
    if (currentPlayer?.id === accusedPlayer.id) {
      return (
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text>You have been accused! Make your case.</Text>
            <TextInput
              label="Your Defense"
              placeholder="I am not the liar because..."
              value={defenseText}
              onChange={(e) => setDefenseText(e.currentTarget.value)}
              required
            />
            <Button type="submit" loading={submitDefenseMutation.isPending}>
              Submit Defense
            </Button>
          </Stack>
        </form>
      );
    }
    return <Text>Waiting for {accusedPlayer.nickname} to make their defense.</Text>;
  };

  return (
    <Stack>
      <Title order={3}>Defense Phase</Title>
      <Alert color="orange" title="Accusation">
        {accusedPlayer.nickname} has been accused as the Liar!
      </Alert>
      <Paper withBorder p="md" mt="md">
        {renderContent()}
      </Paper>
    </Stack>
  );
};
