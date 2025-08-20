import {useState} from 'react';
import {useAuthStore} from '@/stores/authStore';
import {useGiveHint} from '@/features/give-hint/hooks/useGiveHint';
import {Button, Paper, Stack, Text, TextInput, Title} from '@mantine/core';
import {PlayerList} from '@/features/game-play/ui/PlayerList';

export const HintPhase = ({ gameState }) => {
  const { user } = useAuthStore();
  const [hint, setHint] = useState('');
  const giveHintMutation = useGiveHint();

  const currentPlayer = gameState.players.find(p => p.nickname === user.nickname);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hint.trim()) {
      giveHintMutation.mutate({ gameNumber: gameState.gameNumber, hint });
    }
  };

  const renderContent = () => {
    if (!currentPlayer || !currentPlayer.isAlive) {
      return <Text>You are observing.</Text>;
    }

    if (currentPlayer.state === 'GAVE_HINT') {
      return <Text>You have submitted your hint. Waiting for other players...</Text>;
    }

    if (currentPlayer.state === 'WAITING_FOR_HINT') {
      return (
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text>Your word is: <strong>{currentPlayer.word || 'Liar'}</strong></Text>
            <TextInput
              label="Your Hint"
              placeholder="Enter a hint for your word"
              value={hint}
              onChange={(e) => setHint(e.currentTarget.value)}
              required
            />
            <Button type="submit" loading={giveHintMutation.isPending}>
              Submit Hint
            </Button>
          </Stack>
        </form>
      );
    }

    return <Text>Waiting for your turn...</Text>;
  };

  return (
    <Stack>
      <Title order={3}>Round {gameState.currentRound}: Give a Hint</Title>
      <Paper withBorder p="md">
        {renderContent()}
      </Paper>
      <PlayerList players={gameState.players} />
    </Stack>
  );
};
