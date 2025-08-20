import {useMemo} from 'react';
import {Alert, Button, Center, Loader, Modal, Paper, Stack, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {CreateRoomForm} from '@/features/create-room';
import {RoomList} from '@/features/room-list/ui/RoomList';
import {useSubjects} from '@/features/subjects/hooks/useSubjects';

export const LobbyPage = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const { data: subjectsData, isLoading, isError } = useSubjects();

  const subjectOptions = useMemo(() => {
    if (!subjectsData) return [];
    // The API returns an array of { id: number, content: string }
    return subjectsData.map(subject => ({
      value: subject.id.toString(),
      label: subject.content,
    }));
  }, [subjectsData]);

  return (
    <>
      <Modal opened={opened} onClose={close} title="Create New Game Room">
        {isLoading && <Center><Loader /></Center>}
        {isError && <Alert color="red" title="Error">Failed to load subjects.</Alert>}
        {subjectsData && (
          <CreateRoomForm subjects={subjectOptions} onClose={close} />
        )}
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