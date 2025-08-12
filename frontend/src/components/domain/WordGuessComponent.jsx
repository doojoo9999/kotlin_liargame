import React, {useState} from 'react';
import {Alert, Button, Group, Stack, Text, TextInput, Title} from '@mantine/core';
import {useMutation} from '@tanstack/react-query';
import {guessWord} from '../../api/mutations/gameMutations';

function WordGuessComponent({ gameNumber, playerRole, onGuessSubmit, guessResult, gameResult }) {
  const [guess, setGuess] = useState('');

  const guessMutation = useMutation({
    mutationFn: (variables) => guessWord(variables.gameNumber, variables.guessedWord),
    onSuccess: (data) => {
      setGuess('');
      if (onGuessSubmit) {
        onGuessSubmit(data);
      }
    },
    onError: (error) => {
      console.error('Failed to guess word:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (guess.trim() && gameNumber) {
      guessMutation.mutate({ gameNumber, guessedWord: guess });
    }
  };

  if (playerRole !== 'LIAR') {
    return <Text>Waiting for the Liar to guess the word...</Text>;
  }

  if (gameResult) {
    return (
      <Stack align="center">
        <Title order={2}>Game Over</Title>
        <Text size="xl" fw={700}>{gameResult.winner} Wins!</Text>
        <Text>{gameResult.message}</Text>
      </Stack>
    );
  }

  if (guessResult) {
    return (
      <Alert color={guessResult.correct ? 'green' : 'red'} title="Guess Result">
        You guessed: {guessResult.guessedWord}. The word was {guessResult.actualWord}. You were {guessResult.correct ? 'correct' : 'incorrect'}!
      </Alert>
    );
  }

  return (
    <Stack align="center">
      <Title order={2}>Liar's Chance</Title>
      <Text>Guess the citizen's word to win!</Text>
      <form onSubmit={handleSubmit}>
        <Group>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Enter your guess..."
            value={guess}
            onChange={(e) => setGuess(e.currentTarget.value)}
            disabled={guessMutation.isPending}
          />
          <Button type="submit" loading={guessMutation.isPending}>
            Submit Guess
          </Button>
        </Group>
      </form>
    </Stack>
  );
}

export default WordGuessComponent;
