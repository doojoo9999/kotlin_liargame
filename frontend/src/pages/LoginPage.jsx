import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { useAuth } from '../hooks/useAuth';
import {
  Box,
  Button,
  TextInput,
  Text,
  Container,
  Paper,
  Loader,
  Stack,
  Title,
} from '@mantine/core';
import { IconLogin, IconSwords } from '@tabler/icons-react';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggingIn, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
    }
  }, [isAuthenticated, navigate]);

  // Step 1: Use react-hook-form (via @mantine/form)
  const form = useForm({
    initialValues: {
      nickname: '',
    },
    validate: {
      nickname: (value) => {
        const trimmed = value.trim();
        if (!trimmed) return 'Nickname is required.';
        if (trimmed.length < 2) return 'Nickname must be at least 2 characters long.';
        if (trimmed.length > 12) return 'Nickname must be at most 12 characters long.';
        if (/[<>\"'&]/.test(trimmed)) return 'Special characters are not allowed.';
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
                fontFamily: 'SeoulAlrimTTF-Heavy, sans-serif',
                color: 'var(--mantine-color-blue-6)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              라이어 게임
            </Title>
            <Text size="lg" c="dimmed">
              Enter your nickname to start the game!
            </Text>
          </Stack>

          {/* Step 1: Form with react-hook-form */}
          <form onSubmit={form.onSubmit(handleLoginSubmit)}>
            <Stack>
              {/* Step 4: Modernized Component Name */}
              <TextInput
                label="Nickname"
                placeholder="Enter your nickname"
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
                {isLoggingIn ? 'Logging In...' : 'Start Game'}
              </Button>
            </Stack>
          </form>

          <Paper mt="xl" p="md" withBorder radius="md" bg="gray.0">
            <Text fw={700} c="dimmed" mb="xs">
              How to Play:
            </Text>
            <Text c="dimmed" ta="left" size="sm">
              • One player becomes the Liar.<br />
              • All other players (Citizens) get the same secret word.<br />
              • The Liar gets a different, but related, word (or none at all!).<br />
              • Talk to each other and find the Liar!
            </Text>
          </Paper>

          <Text c="dimmed" size="xs" mt="xl">
            Liar Game v2.0 - Powered by React & Mantine
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
