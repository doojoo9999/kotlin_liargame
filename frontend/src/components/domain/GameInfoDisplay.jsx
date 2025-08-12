import React from 'react';
import {Badge, Paper, Stack, Text, Title} from '@mantine/core';

function GameInfoDisplay({ gameState, currentRound, gameTimer, assignedWord, playerRole, moderatorMessage }) {
  return (
    <Paper shadow="sm" p="md" style={{ textAlign: 'center' }}>
      <Title order={3} mb="xs">Game Status</Title>
      <Stack align="center" spacing="xs">
        <Badge size="lg" color="blue">{gameState}</Badge>
        <Text size="md">Round: {currentRound}</Text>
        <Text size="md">Time Left: {gameTimer}s</Text>
        {playerRole && <Text size="md">Your Role: <Text span fw={700}>{playerRole}</Text></Text>}
        {assignedWord && <Text size="md">Your Word: <Text span fw={700}>{assignedWord}</Text></Text>}
        {moderatorMessage && <Text size="md" c="grape">Moderator: {moderatorMessage}</Text>}
      </Stack>
    </Paper>
  );
}

export default GameInfoDisplay;
