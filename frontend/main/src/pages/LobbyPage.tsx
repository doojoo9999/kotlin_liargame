import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    LoadingOverlay,
    Modal,
    NumberInput,
    Stack,
    Switch,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {useForm} from '@mantine/form';
import {notifications} from '@mantine/notifications';
import {IconInfoCircle, IconLock, IconLogout, IconPlus, IconRefresh, IconUsers} from '@tabler/icons-react';

interface GameRoom {
  gameNumber: number;
  roomName: string;
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
  gameState: 'WAITING' | 'PLAYING' | 'ENDED';
  hostName: string;
}

interface CreateRoomForm {
  roomName: string;
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
}

export function LobbyPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

  const createRoomForm = useForm<CreateRoomForm>({
    initialValues: {
      roomName: '',
      maxPlayers: 6,
      isPrivate: false,
      password: '',
    },
    validate: {
      roomName: (value) =>
        value.length < 2 ? '방 이름은 2글자 이상이어야 합니다' : null,
      maxPlayers: (value) =>
        value < 4 || value > 8 ? '플레이어는 4명~8명이어야 합니다' : null,
      password: (value, values) =>
        values.isPrivate && (!value || value.length < 1) ? '비공개 방은 비밀번호가 필요합니다' : null,
    },
  });

  const loadRooms = async () => {
    setLoading(true);
    try {
      // TODO: 실제 API 호출
      console.log('Loading rooms...');

      // 임시 데이터
      const mockRooms: GameRoom[] = [
        {
          gameNumber: 1,
          roomName: '재미있는 라이어 게임',
          currentPlayers: 3,
          maxPlayers: 6,
          isPrivate: false,
          gameState: 'WAITING',
          hostName: '플레이어1'
        },
        {
          gameNumber: 2,
          roomName: '고수만 오세요',
          currentPlayers: 5,
          maxPlayers: 6,
          isPrivate: true,
          gameState: 'PLAYING',
          hostName: '게임마스터'
        }
      ];

      setRooms(mockRooms);
    } catch (error) {
      notifications.show({
        title: '오류',
        message: '방 목록을 불러오는데 실패했습니다.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (values: CreateRoomForm) => {
    try {
      // TODO: 실제 방 생성 API 호출
      console.log('Creating room:', values);

      notifications.show({
        title: '방 생성 완료',
        message: `${values.roomName} 방이 생성되었습니다.`,
        color: 'green',
      });

      closeCreateModal();
      createRoomForm.reset();
      loadRooms();
    } catch (error) {
      notifications.show({
        title: '오류',
        message: '방 생성에 실패했습니다.',
        color: 'red',
      });
    }
  };

  const handleJoinRoom = async (room: GameRoom) => {
    if (room.gameState === 'PLAYING') {
      notifications.show({
        title: '참여 불가',
        message: '이미 게임이 진행 중인 방입니다.',
        color: 'orange',
      });
      return;
    }

    try {
      // TODO: 실제 방 참여 API 호출
      console.log('Joining room:', room.gameNumber);

      navigate(`/game/${room.gameNumber}`);
    } catch (error) {
      notifications.show({
        title: '오류',
        message: '방 참여에 실패했습니다.',
        color: 'red',
      });
    }
  };

  const handleLogout = () => {
    // TODO: 실제 로그아웃 API 호출
    navigate('/login');
  };

  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <Container size="lg" py="xl">
      <LoadingOverlay visible={loading} />

      <Group justify="space-between" mb="xl">
        <Title order={1}>게임 로비</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={loadRooms}
          >
            새로고침
          </Button>
          <Button
            leftSection={<IconLogout size={16} />}
            variant="subtle"
            color="red"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </Group>
      </Group>

      <Alert icon={<IconInfoCircle size={16} />} mb="xl">
        실시간 라이어 게임에 오신 것을 환영합니다! 새로운 방을 만들거나 기존 방에 참여해보세요.
      </Alert>

      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>활성 게임 방 ({rooms.length}개)</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreateModal}
        >
          새 방 만들기
        </Button>
      </Group>

      <Grid>
        {rooms.map((room) => (
          <Grid.Col key={room.gameNumber} span={{ base: 12, sm: 6, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="lg" truncate>
                    {room.roomName}
                  </Text>
                  {room.isPrivate && <IconLock size={16} color="gray" />}
                </Group>

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {room.currentPlayers}/{room.maxPlayers}
                    </Text>
                  </Group>
                  <Badge
                    color={
                      room.gameState === 'WAITING' ? 'green' :
                      room.gameState === 'PLAYING' ? 'orange' : 'gray'
                    }
                    variant="light"
                  >
                    {room.gameState === 'WAITING' ? '대기중' :
                     room.gameState === 'PLAYING' ? '게임중' : '종료됨'}
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed">
                  방장: {room.hostName}
                </Text>

                <Button
                  fullWidth
                  disabled={room.currentPlayers >= room.maxPlayers || room.gameState !== 'WAITING'}
                  onClick={() => handleJoinRoom(room)}
                >
                  {room.currentPlayers >= room.maxPlayers ? '방이 가득참' : '참여하기'}
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {rooms.length === 0 && !loading && (
        <Box ta="center" py="xl">
          <Text size="lg" c="dimmed">현재 활성화된 게임 방이 없습니다.</Text>
          <Text size="sm" c="dimmed" mb="md">새로운 방을 만들어 게임을 시작해보세요!</Text>
          <Button onClick={openCreateModal}>첫 번째 방 만들기</Button>
        </Box>
      )}

      {/* 방 생성 모달 */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="새 게임 방 만들기"
        size="md"
      >
        <form onSubmit={createRoomForm.onSubmit(handleCreateRoom)}>
          <Stack gap="md">
            <TextInput
              label="방 이름"
              placeholder="게임 방의 이름을 입력하세요"
              required
              {...createRoomForm.getInputProps('roomName')}
            />

            <NumberInput
              label="최대 플레이어 수"
              placeholder="4"
              min={4}
              max={8}
              required
              {...createRoomForm.getInputProps('maxPlayers')}
            />

            <Switch
              label="비공개 방"
              description="비밀번호를 설정하여 초대받은 사람만 참여할 수 있습니다"
              {...createRoomForm.getInputProps('isPrivate', { type: 'checkbox' })}
            />

            {createRoomForm.values.isPrivate && (
              <TextInput
                label="비밀번호"
                placeholder="방 비밀번호를 입력하세요"
                required
                {...createRoomForm.getInputProps('password')}
              />
            )}

            <Divider />

            <Group justify="flex-end">
              <Button variant="subtle" onClick={closeCreateModal}>
                취소
              </Button>
              <Button type="submit">
                방 만들기
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
