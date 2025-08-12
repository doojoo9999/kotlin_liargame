import React from 'react';
import {Avatar, Indicator, Paper, Stack, Text} from '@mantine/core';

function PlayerProfile({ player, isCurrentTurn }) {
  return (
    <Indicator inline size={16} color="yellow" disabled={!isCurrentTurn}>
      <Paper
        p="xs"
        shadow="sm"
        radius="md"
        withBorder
        style={{
          opacity: player.isAlive === false ? 0.5 : 1,
          border: isCurrentTurn ? '2px solid yellow' : '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <Stack align="center" gap="xs">
          <Avatar src={player.avatarUrl} alt={`${player.nickname}'s avatar`} size="lg" radius="50%" />
          <Text size="sm" fw={500}>
            {player.nickname}
          </Text>
        </Stack>
      </Paper>
    </Indicator>
  );
}

export default PlayerProfile;
