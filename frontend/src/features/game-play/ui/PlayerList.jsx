import {Avatar, Badge, Card, SimpleGrid, Stack, Text} from '@mantine/core';

export const PlayerList = ({ players = [] }) => {
  return (
    <Stack>
      <Text fw={500}>Players</Text>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
        {players.map((player) => (
          <Card
            key={player.id}
            shadow="sm"
            padding="sm"
            radius="md"
            withBorder
            style={{ opacity: player.isAlive ? 1 : 0.5 }}
          >
            <Stack align="center" gap="xs">
              <Avatar size="lg" radius="xl" />
              <Text ta="center" size="sm" fw={500}>
                {player.nickname}
              </Text>
              {player.isHost && <Badge size="xs">Host</Badge>}
              {!player.isAlive && <Badge size="xs" color="red">Eliminated</Badge>}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
};
