import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useForm} from '@mantine/form';
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
    Divider,
    Group,
    LoadingOverlay,
    Modal,
    MultiSelect,
    NumberInput,
    PasswordInput,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconLock, IconLogin, IconLogout, IconPlus, IconRefresh} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';

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
  const [isTitlePristine, setIsTitlePristine] = useState(true);

  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useQuery({ queryKey: ['rooms'], queryFn: getAllRooms });
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });

  const createRoomMutation = useMutation({ 
    mutationFn: createRoom, 
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setCurrentRoom(newRoom);
      navigate(`/room/${newRoom.gameNumber}`);
      closeCreateModal();
    },
    onError: (error) => {
        notifications.show({ title: '방 만들기 실패', message: error.response?.data?.message || '알 수 없는 오류가 발생했습니다.', color: 'red' });
    }
  });

  const joinRoomMutation = useMutation({ mutationFn: (variables) => joinRoom(variables.gameNumber, variables.password), onSuccess: (joinedRoom) => {
    setCurrentRoom(joinedRoom);
    navigate(`/room/${joinedRoom.gameNumber}`);
    closeJoinModal();
  }});

  const addSubjectMutation = useMutation({ 
    mutationFn: addSubject, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      notifications.show({ title: '성공', message: '새로운 주제가 추가되었습니다.', color: 'green' });
      contentForm.setFieldValue('newSubject', '');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || '주제 추가 중 오류가 발생했습니다.';
      notifications.show({ title: '주제 추가 실패', message: errorMessage, color: 'red' });
    }
  });

  const addWordMutation = useMutation({ 
    mutationFn: (variables) => addWord(variables.subject, variables.word), 
    onSuccess: () => {
      notifications.show({ title: '성공', message: '새로운 단어가 추가되었습니다.', color: 'green' });
      contentForm.setFieldValue('newWord', '');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || '단어 추가 중 알 수 없는 오류가 발생했습니다.';
      notifications.show({ title: '단어 추가 실패', message: errorMessage, color: 'red' });
    }
  });

  const createRoomForm = useForm({
    initialValues: {
      title: '',
      maxPlayers: 8,
      rounds: 5, // Default rounds added
      password: '',
      subjectIds: [],
    },
    validate: {
      title: (value) => (value.trim().length >= 2 ? null : '방 제목은 2글자 이상이어야 합니다.'),
      maxPlayers: (value) => (value >= 3 && value <= 15 ? null : '인원은 3명에서 15명 사이여야 합니다.'),
      rounds: (value) => (value >= 1 && value <= 10 ? null : '라운드는 1에서 10 사이여야 합니다.'),
    },
  });

  const contentForm = useForm({
    initialValues: {
      newSubject: '',
      selectedSubjectForWord: '',
      newWord: '',
    },
  });

  useEffect(() => {
    if (createModalOpened && user?.nickname) {
      const defaultTitle = `${user.nickname}님의 방`;
      createRoomForm.setFieldValue('title', defaultTitle);
      setIsTitlePristine(true);
    } else if (!createModalOpened) {
      createRoomForm.reset();
    }
  }, [createModalOpened, user?.nickname]);

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

  const getRoomStateText = (state) => {
    switch (state) {
      case 'WAITING': return '대기중';
      case 'IN_PROGRESS': return '게임중';
      case 'FINISHED': return '종료';
      default: return state;
    }
  };

  return (
    <Container py="xl">
      <LoadingOverlay visible={roomsLoading || joinRoomMutation.isPending || isLoggingOut} />
      <Group justify="space-between" mb="xl">
        <Title order={1}>로비</Title>
        <Group>
          <Text>{user?.nickname}님, 환영합니다!</Text>
          <Tooltip label="새로고침"><ActionIcon variant="default" onClick={() => refetchRooms()} disabled={roomsLoading}><IconRefresh /></ActionIcon></Tooltip>
          <Button leftSection={<IconPlus size={14} />} onClick={openCreateModal}>방 만들기</Button>
          <Button leftSection={<IconPlus size={14} />} onClick={openAddContentModal}>주제/단어 추가</Button>
          <Button color="red" leftSection={<IconLogout size={14} />} onClick={() => logout()} loading={isLoggingOut}>로그아웃</Button>
        </Group>
      </Group>

      {roomsError && <Alert color="red" title="오류">방 목록을 불러오는 중 오류가 발생했습니다: {roomsError.message}</Alert>}

      <Table verticalSpacing="md" highlightOnHover>
        <Table.Thead><Table.Tr><Table.Th>방 제목</Table.Th><Table.Th>방장</Table.Th><Table.Th>인원</Table.Th><Table.Th>상태</Table.Th><Table.Th>입장</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{rooms.map((room) => {
            const currentPlayers = room.playerCount ?? room.currentPlayers ?? 0;
            const maxPlayers = room.maxPlayers ?? room.gameParticipants ?? 0;
            return (
                <Table.Tr key={room.gameNumber}>
                    <Table.Td>{room.title}</Table.Td>
                    <Table.Td>{room.host}</Table.Td>
                    <Table.Td>{currentPlayers}/{maxPlayers}</Table.Td>
                    <Table.Td><Badge color={room.state === 'WAITING' ? 'green' : 'yellow'}>{getRoomStateText(room.state)}</Badge></Table.Td>
                    <Table.Td><Tooltip label={room.hasPassword ? '비밀번호 필요' : '방 입장'}><ActionIcon variant="subtle" onClick={() => handleJoinClick(room)} disabled={currentPlayers >= maxPlayers || room.state !== 'WAITING'}>{room.hasPassword ? <IconLock size={16} /> : <IconLogin size={16} />}</ActionIcon></Tooltip></Table.Td>
                </Table.Tr>
            );
        })}</Table.Tbody>
      </Table>

      <Modal opened={createModalOpened} onClose={closeCreateModal} title="새 방 만들기" centered>
        <form onSubmit={createRoomForm.onSubmit((values) => createRoomMutation.mutate({
          gameName: values.title,
          gameParticipants: values.maxPlayers,
          gameTotalRounds: values.rounds,
          gamePassword: values.password || null,
          subjectIds: values.subjectIds.map(id => Number(id)),
        }))}>
          <Stack>
            <TextInput
              label="방 제목"
              required
              {...createRoomForm.getInputProps('title')}
              onFocus={() => {
                if (isTitlePristine) {
                  createRoomForm.setFieldValue('title', '');
                  setIsTitlePristine(false);
                }
              }}
            />
            <NumberInput label="최대 인원" min={3} max={15} required {...createRoomForm.getInputProps('maxPlayers')} />
            <NumberInput label="총 라운드 수" min={1} max={10} required {...createRoomForm.getInputProps('rounds')} />
            <PasswordInput label="비밀번호 (선택 사항)" placeholder="설정 시 비밀방이 됩니다" {...createRoomForm.getInputProps('password')} />
            <MultiSelect
              label="주제"
              placeholder="플레이할 주제를 선택하세요 (미선택 시 랜덤)"
              data={subjects.map(s => ({ value: String(s.id), label: s.name }))}
              searchable
              nothingFoundMessage="검색 결과 없음..."
              disabled={subjectsLoading}
              {...createRoomForm.getInputProps('subjectIds')}
            />
            <Button type="submit" loading={createRoomMutation.isPending} mt="md">만들기</Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={joinModalOpened} onClose={closeJoinModal} title={`'${selectedRoom?.title}' 방 입장`} centered>
        <form onSubmit={handleJoinSubmit}>
          <Stack>
            <PasswordInput label="비밀번호" required autoFocus value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
            <Button type="submit" loading={joinRoomMutation.isPending}>입장</Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={addContentModalOpened} onClose={closeAddContentModal} title="새 콘텐츠 추가" centered>
        <form onSubmit={contentForm.onSubmit((values) => addSubjectMutation.mutate(values.newSubject))}>
          <Stack>
            <Title order={4}>새 주제 추가</Title>
            <Group align="flex-end">
              <TextInput label="주제 이름" placeholder="예: 동물" required style={{ flex: 1 }} {...contentForm.getInputProps('newSubject')} />
              <Button type="submit" loading={addSubjectMutation.isPending}>추가</Button>
            </Group>
          </Stack>
        </form>

        <Divider my="lg" />

        <form onSubmit={contentForm.onSubmit((values) => addWordMutation.mutate({ subject: values.selectedSubjectForWord, word: values.newWord }))}>
          <Stack>
            <Title order={4}>새 단어 추가</Title>
            <Select
              label="주제 선택"
              placeholder="단어를 추가할 주제를 선택하세요"
              data={subjects.map(s => ({ value: s.name, label: s.name }))}
              required
              searchable
              nothingFoundMessage="해당 주제가 없습니다..."
              disabled={subjectsLoading}
              {...contentForm.getInputProps('selectedSubjectForWord')}
            />
            <TextInput label="단어" placeholder="예: 사자" required {...contentForm.getInputProps('newWord')} />
            <Button type="submit" loading={addWordMutation.isPending} mt="sm">단어 추가</Button>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}

export default LobbyPage;
