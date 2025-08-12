import React, {useState} from 'react';
import {Button, Group, Stack, Text, TextInput, Title} from '@mantine/core';
import {useMutation} from '@tanstack/react-query';
import {submitDefense} from '../../api/mutations/gameMutations';

function DefenseComponent({ gameNumber, accusedPlayer, currentUserId, onDefenseSubmit }) {
  const [defense, setDefense] = useState('');

  const defenseMutation = useMutation({
    mutationFn: (variables) => submitDefense(variables.gameNumber, variables.defenseText),
    onSuccess: () => {
      setDefense('');
      if (onDefenseSubmit) {
        onDefenseSubmit();
      }
    },
    onError: (error) => {
      console.error('Failed to submit defense:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (defense.trim() && gameNumber) {
      defenseMutation.mutate({ gameNumber, defenseText: defense });
    }
  };

  const isAccused = accusedPlayer?.id === currentUserId;

  return (
    <Stack align="center">
      <Title order={2}>Defense Phase</Title>
      <Text>{accusedPlayer?.nickname} is making their final defense.</Text>
      {isAccused ? (
        <form onSubmit={handleSubmit}>
          <Group>
            <TextInput
              style={{ flex: 1 }}
              placeholder="Enter your defense..."
              value={defense}
              onChange={(e) => setDefense(e.currentTarget.value)}
              disabled={defenseMutation.isPending}
            />
            <Button type="submit" loading={defenseMutation.isPending}>
              Submit Defense
            </Button>
          </Group>
        </form>
      ) : (
        <Text>Waiting for {accusedPlayer?.nickname} to speak...</Text>
      )}
    </Stack>
  );
}

export default DefenseComponent;
