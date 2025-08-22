import {Box, Button, Container, Group, Text} from '@mantine/core';
import {Outlet, useLocation} from 'react-router-dom';
import {useLogoutMutation} from '../../features/auth';
import {useUserStore} from '../../shared/stores/userStore';
import {AppProvider} from '../providers/AppProvider';

export function RootLayout() {
  const nickname = useUserStore((state) => state.nickname);
  const logoutMutation = useLogoutMutation();
  const location = useLocation();

  // Don't show header on the login page
  const showHeader = location.pathname !== '/login';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <AppProvider>
      {showHeader && (
        <Box component="header" py="md" px="lg" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
          <Container fluid>
            <Group justify="space-between">
              <Text fw={700}>라이어 게임</Text>
              {nickname && (
                <Group>
                  <Text>환영합니다, {nickname}님!</Text>
                  <Button variant="outline" size="xs" onClick={handleLogout} loading={logoutMutation.isPending}>
                    로그아웃
                  </Button>
                </Group>
              )}
            </Group>
          </Container>
        </Box>
      )}
      <main>
        <Outlet />
      </main>
    </AppProvider>
  );
}
