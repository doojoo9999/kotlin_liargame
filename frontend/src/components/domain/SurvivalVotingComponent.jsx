import React from 'react';
import {Button, Group, Stack, Text, Title} from '@mantine/core';
import {useMutation} from '@tanstack/react-query';
import {castSurvivalVote} from '../../api/mutations/gameMutations';

function SurvivalVotingComponent({ gameNumber, accusedPlayer, onVoteSubmit }) {
  const survivalVoteMutation = useMutation({
    mutationFn: (variables) => castSurvivalVote(variables.gameNumber, variables.survival),
    onSuccess: () => {
      if (onVoteSubmit) {
        onVoteSubmit();
      }
    },
    onError: (error) => {
      console.error('Failed to cast survival vote:', error);
    },
  });

  const handleVote = (survival) => {
    if (gameNumber) {
      survivalVoteMutation.mutate({ gameNumber, survival });
    }
  };

  return (
    <Stack align="center">
      <Title order={2}>Final Judgment</Title>
      <Text>Decide the fate of {accusedPlayer?.nickname}.</Text>
      <Group mt="md">
        <Button
          color="green"
          onClick={() => handleVote(true)}
          loading={survivalVoteMutation.isPending && survivalVoteMutation.variables?.survival === true}
          disabled={survivalVoteMutation.isPending}
        >
          Spare
        </Button>
        <Button
          color="red"
          onClick={() => handleVote(false)}
          loading={survivalVoteMutation.isPending && survivalVoteMutation.variables?.survival === false}
          disabled={survivalVoteMutation.isPending}
        >
          Eliminate
        </Button>
      </Group>
    </Stack>
  );
}

export default SurvivalVotingComponent;
