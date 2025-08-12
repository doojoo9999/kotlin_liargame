import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {getAllRooms} from '../api/queries/roomQueries';
import {createRoom, joinRoom} from '../api/mutations/roomMutations';
import {getAllSubjects} from '../api/queries/contentQueries';
import {addSubject, addWord} from '../api/mutations/contentMutations';
import {useAuth} from '../hooks/useAuth';
import {useRoomStore} from '../stores/roomStore';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Container,
    Group,
    LoadingOverlay,
    Modal,
    MultiSelect,
    NumberInput,
    PasswordInput,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconLock, IconLogin, IconLogout, IconPlus, IconRefresh} from '@tabler/icons-react';

function LobbyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, isLoggingOut } = useAuth();
  const { setCurrentRoom } = useRoomStore();

  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [joinModalOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false);
  const [addContentModalOpened, { open: openAddContentModal, close: closeAddContentModal }] = useDisclosure(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');

  // Data Fetching
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: getAllRooms,
    staleTime: 1000 * 30, // 30 seconds
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getAllSubjects,
    staleTime: Infinity, // Subjects don't change often
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setCurrentRoom(newRoom);
      navigate(`/room/${newRoom.gameNumber}`);
      closeCreateModal();
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: (variables) => joinRoom(variables.gameNumber, variables.password),
    onSuccess: (joinedRoom) => {
      setCurrentRoom(joinedRoom);
      navigate(`/room/${joinedRoom.gameNumber}`);
      closeJoinModal();
    },
  });

  const addSubjectMutation = useMutation({
    mutationFn: addSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  const addWordMutation = useMutation({
    mutationFn: (variables) => addWord(variables.subject, variables.word),
    onSuccess: () => {
      // No need to invalidate, word count is not shown here
    },
  });

  // Handlers
  const handleJoinClick = (room) => {
    setSelectedRoom(room);
    if (room.hasPassword) {
      openJoinModal();
    } else {
      joinRoomMutation.mutate({ gameNumber: room.gameNumber });
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    joinRoomMutation.mutate({ gameNumber: selectedRoom.gameNumber, password: joinPassword });
  };

  // Render
  return (
    <Container py="xl">
      <LoadingOverlay visible={roomsLoading || joinRoomMutation.isPending || isLoggingOut} />
      <Group justify="space-between" mb="xl">
        <Title order={1}>Lobby</Title>
        <Group>
          <Text>Welcome, {user?.nickname}!</Text>
          <ActionIcon variant="default" onClick={() => refetchRooms()} disabled={roomsLoading}>
            <IconRefresh />
          </ActionIcon>
          <Button leftSection={<IconPlus size={14} />} onClick={openCreateModal}>
            Create Room
          </Button>
          <Button leftSection={<IconPlus size={14} />} onClick={openAddContentModal}>
            Add Content
          </Button>
          <Button color="red" leftSection={<IconLogout size={14} />} onClick={() => logout()} loading={isLoggingOut}>
            Logout
          </Button>
        </Group>
      </Group>

      {roomsError && (
        <Alert color="red" title="Error fetching rooms">
          {roomsError.message}
        </Alert>
      )}

      <Table verticalSpacing="md" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Host</Table.Th>
            <Table.Th>Players</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rooms.map((room) => (
            <Table.Tr key={room.gameNumber}>
              <Table.Td>{room.title}</Table.Td>
              <Table.Td>{room.host}</Table.Td>
              <Table.Td>{room.playerCount}/{room.maxPlayers}</Table.Td>
              <Table.Td>
                <Badge color={room.state === 'WAITING' ? 'green' : 'yellow'}>{room.state}</Badge>
              </Table.Td>
              <Table.Td>
                <Tooltip label={room.hasPassword ? 'Password required' : 'Join room'}>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => handleJoinClick(room)}
                    disabled={room.playerCount >= room.maxPlayers || room.state !== 'WAITING'}
                  >
                    {room.hasPassword ? <IconLock size={16} /> : <IconLogin size={16} />}
                  </ActionIcon>
                </Tooltip>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Create Room Modal */}
      <Modal opened={createModalOpened} onClose={closeCreateModal} title="Create New Room">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = {
            gameName: formData.get('title'),
            gameParticipants: Number(formData.get('maxPlayers')),
            gameTotalRounds: 3, // default
            gamePassword: formData.get('password'),
            subjectIds: formData.getAll('subjects'),
          };
          createRoomMutation.mutate(data);
        }}>
          <Stack>
            <TextInput name="title" label="Room Title" required />
            <NumberInput name="maxPlayers" label="Max Players" min={3} max={15} defaultValue={8} required />
            <PasswordInput name="password" label="Password (optional)" />
            <MultiSelect
              name="subjects"
              label="Subjects"
              data={subjects.map(s => ({ value: s.id, label: s.name }))}
              placeholder="Select subjects"
              searchable
              nothingFoundMessage="Nothing found..."
              disabled={subjectsLoading}
            />
            <Button type="submit" loading={createRoomMutation.isPending}>Create</Button>
          </Stack>
        </form>
      </Modal>

      {/* Join Room Modal */}
      <Modal opened={joinModalOpened} onClose={closeJoinModal} title={`Join ${selectedRoom?.title}`}>
        <form onSubmit={handleJoinSubmit}>
          <Stack>
            <PasswordInput
              label="Password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" loading={joinRoomMutation.isPending}>Join</Button>
          </Stack>
        </form>
      </Modal>

      {/* Add Content Modal */}
      <Modal opened={addContentModalOpened} onClose={closeAddContentModal} title="Add New Content">
        <form onSubmit={e => { e.preventDefault(); addSubjectMutation.mutate(e.currentTarget.subject.value); e.currentTarget.reset(); }}>
          <Group>
            <TextInput name="subject" label="New Subject" required style={{ flex: 1 }} />
            <Button type="submit" mt="xl" loading={addSubjectMutation.isPending}>Add Subject</Button>
          </Group>
        </form>
        <form onSubmit={e => { e.preventDefault(); addWordMutation.mutate({ subject: e.currentTarget.subject.value, word: e.currentTarget.word.value }); e.currentTarget.reset(); }}>
          <Stack mt="lg">
            <MultiSelect
              name="subject"
              label="Select Subject"
              data={subjects.map(s => ({ value: s.name, label: s.name }))}
              required
            />
            <TextInput name="word" label="New Word" required />
            <Button type="submit" loading={addWordMutation.isPending}>Add Word</Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

export default LobbyPage;
