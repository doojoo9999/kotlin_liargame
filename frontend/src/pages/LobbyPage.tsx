import {Alert, Button, Center, Container, Group, Loader, Stack, Text, Title} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {AlertCircle, Plus} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useLogoutMutation} from '../features/auth';
import {CreateRoomModal, RoomList, useLobbySocket, useRoomsQuery} from '../features/room';
import {useUserStore} from '../shared/stores/userStore';
import {AddSubjectModal, AddWordsModal} from '../features/subject';

export function LobbyPage() {
  const nickname = useUserStore((state) => state.nickname);
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const { data: rooms, isLoading, isError } = useRoomsQuery();
  const logoutMutation = useLogoutMutation();
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [subjectModalOpened, { open: openSubjectModal, close: closeSubjectModal }] = useDisclosure(false);
  const [wordsModalOpened, { open: openWordsModal, close: closeWordsModal }] = useDisclosure(false);
  const [preSelectedSubject, setPreSelectedSubject] = useState<string>('');
  const navigate = useNavigate();

  useLobbySocket();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const handleSubjectAdded = (subjectName: string) => {
    setPreSelectedSubject(subjectName);
    openWordsModal();
  };

  const handleWordsModalClose = () => {
    setPreSelectedSubject('');
    closeWordsModal();
  };

  return (
    <>
      <CreateRoomModal opened={createModalOpened} onClose={closeCreateModal} />
      <AddSubjectModal
        opened={subjectModalOpened}
        onClose={closeSubjectModal}
        onSubjectAdded={handleSubjectAdded}
      />
      <AddWordsModal
        opened={wordsModalOpened}
        onClose={handleWordsModalClose}
        preSelectedSubject={preSelectedSubject}
      />

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
            <Group>
              <Button leftSection={<Plus size={18} />} onClick={openCreateModal}>
                방 만들기
              </Button>
              <Button variant="light" leftSection={<Plus size={18} />} onClick={openSubjectModal}>
                주제 추가
              </Button>
              <Button variant="light" leftSection={<Plus size={18} />} onClick={openWordsModal}>
                답안 추가
              </Button>
            </Group>
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
