import React from 'react';
import {Button, Group, Stack, Text, Title} from '@mantine/core';
import {useMutation} from '@tanstack/react-query';
import {castVote} from '../../api/mutations/gameMutations';

function VotingComponent({ gameNumber, players, currentUserId, onVoteComplete }) {
  const voteMutation = useMutation({
    mutationFn: (variables) => castVote(variables.gameNumber, variables.targetPlayerId),
    onSuccess: (data) => {
      // Notify parent component or handle via WebSocket state update
      if (onVoteComplete) {
        onVoteComplete(data);
      }
    },
    onError: (error) => {
      console.error('Failed to cast vote:', error);
    },
  });

  const handleVote = (targetPlayerId) => {
    if (gameNumber) {
      voteMutation.mutate({ gameNumber, targetPlayerId });
    }
  };

  return (
    <Stack align="center">
      <Title order={2}>Vote for the Liar</Title>
      <Text>Select the player you think is the liar.</Text>
      <Group mt="md">
        {players
          .filter((player) => player.isAlive && player.id !== currentUserId)
          .map((player) => (
            <Button
              key={player.id}
              onClick={() => handleVote(player.id)}
              loading={voteMutation.isPending && voteMutation.variables?.targetPlayerId === player.id}
              disabled={voteMutation.isPending}
            >
              {player.nickname}
            </Button>
          ))}
      </Group>
    </Stack>
  );
}

export default VotingComponent;
