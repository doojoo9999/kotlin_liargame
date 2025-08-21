import {Badge, Button, Group, Paper, Table, Text} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {Lock, LockOpen} from 'lucide-react';
import {useState} from 'react';
import {useJoinRoomMutation} from '../hooks/useJoinRoomMutation';
import type {GameRoom} from '../types';
import {PasswordModal} from './PasswordModal';

interface RoomListProps {
  rooms: GameRoom[];
}

export function RoomList({ rooms }: RoomListProps) {
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const joinRoomMutation = useJoinRoomMutation();

  const handleJoinClick = (room: GameRoom) => {
    if (room.isPrivate) {
      setSelectedRoom(room);
      openPasswordModal();
    } else {
      joinRoomMutation.mutate({ gameNumber: room.gameNumber });
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (selectedRoom) {
      joinRoomMutation.mutate(
        { gameNumber: selectedRoom.gameNumber, gamePassword: password },
        {
          onSuccess: () => {
            closePasswordModal();
            setSelectedRoom(null);
          },
        }
      );
    }
  };

  if (rooms.length === 0) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Text>현재 생성된 방이 없습니다. 새로운 방을 만들어보세요!</Text>
      </Paper>
    );
  }

  const rows = rooms.map((room) => (
    <Table.Tr key={room.gameNumber}>
      <Table.Td>
        <Badge color={room.status === 'WAITING' ? 'green' : 'yellow'}>
          {room.status === 'WAITING' ? '대기중' : '게임중'}
        </Badge>
      </Table.Td>
      <Table.Td>{room.title}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          {room.isPrivate ? <Lock size={16} /> : <LockOpen size={16} />}
          <Text size="sm">{room.isPrivate ? '비공개' : '공개'}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        {room.currentPlayers} / {room.maxPlayers}
      </Table.Td>
      <Table.Td>
        <Button
          size="xs"
          disabled={room.status !== 'WAITING'}
          onClick={() => handleJoinClick(room)}
          loading={joinRoomMutation.isPending && selectedRoom?.gameNumber !== room.gameNumber}
        >
          참여
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <PasswordModal
        opened={passwordModalOpened}
        onClose={closePasswordModal}
        onSubmit={handlePasswordSubmit}
        loading={joinRoomMutation.isPending}
      />
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>상태</Table.Th>
            <Table.Th>방 제목</Table.Th>
            <Table.Th>공개 여부</Table.Th>
            <Table.Th>인원</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
