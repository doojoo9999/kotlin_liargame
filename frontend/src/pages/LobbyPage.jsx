import {Button, Modal, Paper, Stack, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {CreateRoomForm} from '@/features/create-room';
import {RoomList} from '@/features/room-list/ui/RoomList';

// Placeholder for fetching subjects. In a real app, this would come from an API.
const fakeSubjects = [
  { value: 'movies', label: 'Movies' },
  { value: 'food', label: 'Food' },
  { value: 'animals', label: 'Animals' },
];

export const LobbyPage = () => {
  const [opened, { open, close }] = useDisclosure(false);
  
  // In a real app, you would use React Query to fetch the list of subjects.
  // const { data: subjects } = useQuery(...)

  return (
    <>
      <Modal opened={opened} onClose={close} title="Create New Game Room">
        <CreateRoomForm subjects={fakeSubjects} onClose={close} />
      </Modal>

      <Stack align="center" pt="xl" gap="xl">
        <Title order={1}>Game Lobby</Title>
        <Button onClick={open}>Create Room</Button>
        <Paper withBorder shadow="md" p="md" style={{ width: '80%', maxWidth: '800px' }}>
          <RoomList />
        </Paper>
      </Stack>
    </>
  );
};
