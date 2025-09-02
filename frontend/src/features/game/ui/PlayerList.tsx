import {Avatar, Badge, Group, Paper, Stack, Text} from '@mantine/core';
import {Crown} from 'lucide-react';
import type {Player} from '../../room/types';

interface PlayerListProps {
  players: Player[];
  gameOwner: string;
}

export function PlayerList({ players, gameOwner }: PlayerListProps) {
  return (
    <Stack>
      {players.map((player) => (
         <Paper key={player.userId} p="sm" withBorder radius="md">
          <Group justify="space-between">
            <Group>
              <Avatar color="blue" radius="xl">
                {player.nickname.slice(0, 2)}
              </Avatar>
              <Text fw={500}>{player.nickname}</Text>
              {player.nickname === gameOwner && <Crown size={18} color="gold" />}
            </Group>
            {player.isEliminated && <Badge color="red">탈락</Badge>}
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
