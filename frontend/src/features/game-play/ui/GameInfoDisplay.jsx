import {Badge, Group, Paper, Text} from '@mantine/core';

export const GameInfoDisplay = ({ gameState }) => {
  return (
    <Paper withBorder p="md" mb="md">
      <Group justify="space-between">
        <Text><strong>Round:</strong> {gameState.currentRound} / {gameState.rounds}</Text>
        <Badge size="lg">{gameState.subject}</Badge>
        <Text><strong>Players:</strong> {gameState.players.filter(p => p.isAlive).length} / {gameState.players.length}</Text>
      </Group>
    </Paper>
  );
};
