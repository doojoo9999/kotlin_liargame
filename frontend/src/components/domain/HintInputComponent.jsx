import React, {useState} from 'react';
import {Button, Group, TextInput} from '@mantine/core';
import {useMutation} from '@tanstack/react-query';
import {submitHint} from '../../api/mutations/gameMutations';

function HintInputComponent({ gameNumber, isMyTurn }) {
  const [hint, setHint] = useState('');

  const hintMutation = useMutation({
    mutationFn: (variables) => submitHint(variables.gameNumber, variables.hint),
    onSuccess: () => {
      setHint('');
      // Optionally show a success notification
    },
    onError: (error) => {
      // Optionally show an error notification
      console.error('Failed to submit hint:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hint.trim() && gameNumber) {
      hintMutation.mutate({ gameNumber, hint });
    }
  };

  if (!isMyTurn) {
    return null; // Don't show input if it's not the user's turn
  }

  return (
    <form onSubmit={handleSubmit}>
      <Group>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Enter your hint..."
          value={hint}
          onChange={(e) => setHint(e.currentTarget.value)}
          disabled={hintMutation.isPending}
        />
        <Button type="submit" loading={hintMutation.isPending}>
          Submit Hint
        </Button>
      </Group>
    </form>
  );
}

export default HintInputComponent;
