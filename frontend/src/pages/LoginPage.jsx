import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useForm} from '@mantine/form';
import {useAuth} from '../hooks/useAuth';
import {Box, Button, Container, Loader, Paper, Stack, Text, TextInput, Title,} from '@mantine/core';
import {IconLogin, IconSwords} from '@tabler/icons-react';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
    }
  }, [isAuthenticated, navigate]);

  const form = useForm({
    initialValues: {
      nickname: '',
    },
    validate: {
      nickname: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return '닉네임을 입력해주세요.';
        if (trimmed.length < 2) return '닉네임은 최소 2글자 이상이어야 합니다.';
        if (trimmed.length > 12) return '닉네임은 최대 12글자까지 가능합니다.';
        if (/[<>\"'&]/.test(trimmed)) return '닉네임에 특수문자는 사용할 수 없습니다.';
        return null;
      },
    },
  });

  const handleLoginSubmit = (values) => {
    login(values.nickname.trim());
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 'var(--mantine-spacing-md)',
      }}
    >
      <Container size="sm" style={{ width: '100%' }}>
        <Paper
          shadow="xl"
          radius="lg"
          p="xl"
          withBorder
          style={{
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack align="center" mb="xl">
            <IconSwords size={64} style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Title
              order={1}
              style={{
                fontFamily: 'SeoulAlrimTTF-Medium, sans-serif',
                color: 'var(--mantine-color-blue-6)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              라이어 게임
            </Title>
            <Text size="lg" c="dimmed">
              닉네임을 입력하고 게임을 시작하세요!
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleLoginSubmit)}>
            <Stack>
              <TextInput
                label="닉네임"
                placeholder="사용할 닉네임을 입력하세요"
                size="lg"
                radius="md"
                maxLength={12}
                autoFocus
                disabled={isLoggingIn}
                {...form.getInputProps('nickname')}
              />

              <Button
                type="submit"
                fullWidth
                mt="md"
                size="lg"
                radius="md"
                leftSection={isLoggingIn ? <Loader size={20} /> : <IconLogin size={20} />}
                disabled={isLoggingIn || !form.values.nickname.trim()}
              >
                {isLoggingIn ? '로그인 중...' : '게임 시작'}
              </Button>
            </Stack>
          </form>

          <Paper mt="xl" p="md" withBorder radius="md" bg="gray.0">
            <Text fw={700} c="dimmed" mb="xs">
              게임 방법:
            </Text>
            <Text c="dimmed" ta="left" size="sm">
              • 플레이어 중 한 명이 라이어가 됩니다.<br />
              • 라이어를 제외한 모든 플레이어는 같은 제시어를 받습니다.<br />
              • 라이어는 다른 제시어를 받거나, 아무것도 받지 못합니다.<br />
              • 돌아가며 제시어에 대해 설명하고 라이어를 찾아내세요!
            </Text>
          </Paper>

          <Text c="dimmed" size="xs" mt="xl">
            Liar Game v1.0.1 - Powered by React & Mantine
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
