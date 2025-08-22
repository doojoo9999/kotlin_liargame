import {Alert, Button, Center, Container, Group, Loader, Stack, Text, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {AlertCircle, Plus} from 'lucide-react';
import {useLogoutMutation} from '../features/auth/hooks/useLogoutMutation';
import {CreateRoomModal} from '../features/room/ui/CreateRoomModal';
import {RoomList, useRoomsQuery} from '../features/room';
import {useLobbySocket} from '../features/room/hooks/useLobbySocket';
import {useUserStore} from '../shared/stores/userStore';

export function LobbyPage() {
  const { nickname, isLoggedIn } = useUserStore((state) => ({
    nickname: state.nickname,
    isLoggedIn: state.isLoggedIn,
  }));
  const { data: rooms, isLoading, isError } = useRoomsQuery();
  const logoutMutation = useLogoutMutation();
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);

  // Activate WebSocket connection only when logged in
  useLobbySocket();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      <CreateRoomModal opened={createModalOpened} onClose={closeCreateModal} />

      <Container size="md" py="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={1}>Lobby</Title>
            {isLoggedIn && nickname && (
              <Group>
                <Text>환영합니다, {nickname}님!</Text>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleLogout}
                  loading={logoutMutation.isPending}
                >
                  로그아웃
                </Button>
              </Group>
            )}
          </Group>

          {isLoggedIn && (
            <Button leftSection={<Plus size={18} />} onClick={openCreateModal}>
              방 만들기
            </Button>
          )}

          {isLoading && (
            <Center py="xl">
              <Loader />
            </Center>
          )}

          {isError && (
            <Alert
              icon={<AlertCircle size={16} />}
              title="오류 발생"
              color="red"
              variant="light"
            >
              방 목록을 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.
            </Alert>
          )}

          {rooms && <RoomList rooms={rooms} />}
        </Stack>
      </Container>
    </>
  );
}
