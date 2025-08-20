import {Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text} from '@mantine/core';
import {useRooms} from '@/features/room-list/hooks/useRooms';
import {useJoinRoom} from '@/features/join-room/hooks/useJoinRoom';
import {IconUsers} from '@tabler/icons-react';

export const RoomList = () => {
  const { data: roomsData, isLoading, isError } = useRooms();
  const joinRoomMutation = useJoinRoom();

  const handleJoin = (room) => {
    if (room.isPrivate) {
      const password = prompt('This room is private. Please enter the password:');
      if (password !== null) {
        joinRoomMutation.mutate({ gameNumber: room.gameNumber, password });
      }
    } else {
      joinRoomMutation.mutate({ gameNumber: room.gameNumber });
    }
  };

  if (isLoading) {
    return <Center><Loader /></Center>;
  }

  if (isError || !roomsData) {
    return <Text c="red">Failed to load game rooms.</Text>;
  }
  
  const { gameRooms } = roomsData;

  if (gameRooms.length === 0) {
    return <Text>No available rooms. Why not create one?</Text>;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {gameRooms.map((room) => (
        <Card key={room.gameNumber} shadow="sm" padding="lg" radius="md" withBorder>
          <Stack justify="space-between" style={{ height: '100%' }}>
            <Stack>
              <Group justify="space-between">
                <Text fw={500}>{room.roomName}</Text>
                <Badge color={room.status === 'WAITING' ? 'green' : 'yellow'}>
                  {room.status}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Subject: {room.subject}
              </Text>
            </Stack>

            <Group justify="space-between" mt="md">
              <Group gap="xs">
                <IconUsers size={16} />
                <Text size="sm">{`${room.currentPlayer}/${room.maxPlayer}`}</Text>
              </Group>
              <Button
                onClick={() => handleJoin(room)}
                disabled={room.status !== 'WAITING' || joinRoomMutation.isPending}
              >
                Join
              </Button>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
};
